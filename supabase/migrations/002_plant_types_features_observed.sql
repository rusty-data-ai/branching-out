-- =====================================================================
--  Migration 002 — plant types, observed "of interest" records, and
--  fun features. Run this in the Supabase SQL Editor on an existing
--  project (the base schema.sql must already have been applied).
--  Safe to re-run.
-- =====================================================================

alter table public.trees
  add column if not exists plant_type text not null default 'tree',
  add column if not exists origin     text not null default 'planted',
  add column if not exists area_note   text,
  add column if not exists features    text[] not null default '{}',
  add column if not exists notability  text,
  add column if not exists is_veteran  boolean not null default false,
  add column if not exists approx_age  text;

-- Constrain the enum-like columns (added separately so re-runs don't error).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'trees_plant_type_check') then
    alter table public.trees add constraint trees_plant_type_check
      check (plant_type in ('tree','wildflower','shrub','hedge','fruit_bush','climber','other'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trees_origin_check') then
    alter table public.trees add constraint trees_origin_check
      check (origin in ('planted','observed'));
  end if;
end $$;

create index if not exists trees_plant_type_idx on public.trees (plant_type);
create index if not exists trees_origin_idx     on public.trees (origin);
