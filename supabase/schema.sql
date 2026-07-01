-- =====================================================================
--  Guerilla Planting — database schema
--  Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
--  It is safe to re-run: objects use "if not exists" / "or replace".
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. profiles  (one row per user, holds a public display name)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Anonymous planter',
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. trees  (the core registry)
-- ---------------------------------------------------------------------
create table if not exists public.trees (
  id               uuid primary key default gen_random_uuid(),
  species          text not null,
  planted_on       date,
  planted_by_name  text not null default 'Unknown',
  notes            text,
  latitude         double precision not null,
  longitude        double precision not null,
  health_status    text not null default 'healthy'
                     check (health_status in ('thriving','healthy','struggling','dead')),
  needs_attention  boolean not null default false,
  created_by       uuid not null references auth.users (id) on delete cascade,
  created_at       timestamptz not null default now()
);

create index if not exists trees_created_by_idx on public.trees (created_by);

-- ---------------------------------------------------------------------
-- 3. care_logs  (dated maintenance / care timeline per tree)
-- ---------------------------------------------------------------------
create table if not exists public.care_logs (
  id           uuid primary key default gen_random_uuid(),
  tree_id      uuid not null references public.trees (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  author_name  text not null default 'Anonymous planter',
  action       text not null
                 check (action in ('watered','checked','flagged_attention',
                                   'resolved_attention','status_change','note')),
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists care_logs_tree_id_idx on public.care_logs (tree_id);

-- ---------------------------------------------------------------------
-- 4. tree_photos  (metadata; the files live in the storage bucket below)
-- ---------------------------------------------------------------------
create table if not exists public.tree_photos (
  id            uuid primary key default gen_random_uuid(),
  tree_id       uuid not null references public.trees (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  storage_path  text not null,
  created_at    timestamptz not null default now()
);

create index if not exists tree_photos_tree_id_idx on public.tree_photos (tree_id);

-- ---------------------------------------------------------------------
-- 5. Auto-create a profile row whenever a new auth user confirms / signs up.
--    The display name is taken from the signup metadata if provided.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Anonymous planter')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
--  Row Level Security
--  Model: this is a small, trusted community tool.
--   * Any signed-in member can VIEW everything.
--   * Any signed-in member can ADD trees, log care, and add photos
--     (maintenance is collaborative — anyone can water/flag any tree).
--   * A tree's core record can only be DELETED by whoever created it.
-- =====================================================================
alter table public.profiles    enable row level security;
alter table public.trees       enable row level security;
alter table public.care_logs   enable row level security;
alter table public.tree_photos enable row level security;

-- profiles ------------------------------------------------------------
drop policy if exists "profiles_select_all"   on public.profiles;
drop policy if exists "profiles_update_own"    on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- trees ---------------------------------------------------------------
drop policy if exists "trees_select_all"     on public.trees;
drop policy if exists "trees_insert_self"    on public.trees;
drop policy if exists "trees_update_member"  on public.trees;
drop policy if exists "trees_delete_owner"   on public.trees;
create policy "trees_select_all" on public.trees
  for select to authenticated using (true);
create policy "trees_insert_self" on public.trees
  for insert to authenticated with check (auth.uid() = created_by);
create policy "trees_update_member" on public.trees
  for update to authenticated using (true) with check (true);
create policy "trees_delete_owner" on public.trees
  for delete to authenticated using (auth.uid() = created_by);

-- care_logs -----------------------------------------------------------
drop policy if exists "care_select_all"   on public.care_logs;
drop policy if exists "care_insert_self"   on public.care_logs;
drop policy if exists "care_delete_own"    on public.care_logs;
create policy "care_select_all" on public.care_logs
  for select to authenticated using (true);
create policy "care_insert_self" on public.care_logs
  for insert to authenticated with check (auth.uid() = user_id);
create policy "care_delete_own" on public.care_logs
  for delete to authenticated using (auth.uid() = user_id);

-- tree_photos ---------------------------------------------------------
drop policy if exists "photos_select_all"  on public.tree_photos;
drop policy if exists "photos_insert_self"  on public.tree_photos;
drop policy if exists "photos_delete_own"   on public.tree_photos;
create policy "photos_select_all" on public.tree_photos
  for select to authenticated using (true);
create policy "photos_insert_self" on public.tree_photos
  for insert to authenticated with check (auth.uid() = user_id);
create policy "photos_delete_own" on public.tree_photos
  for delete to authenticated using (auth.uid() = user_id);

-- =====================================================================
--  Storage bucket for tree photos
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('tree-photos', 'tree-photos', true)
on conflict (id) do nothing;

-- Public read of photo files; authenticated members can upload/delete their own.
drop policy if exists "tree_photos_public_read"   on storage.objects;
drop policy if exists "tree_photos_auth_insert"    on storage.objects;
drop policy if exists "tree_photos_auth_delete_own" on storage.objects;

create policy "tree_photos_public_read" on storage.objects
  for select using (bucket_id = 'tree-photos');

create policy "tree_photos_auth_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'tree-photos' and owner = auth.uid());

create policy "tree_photos_auth_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'tree-photos' and owner = auth.uid());
