-- =====================================================================
--  003 — Shared TEST USER
--  Run once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
--  Safe to re-run (idempotent).
--
--  Creates a pre-confirmed account so you can try the app without a real
--  inbox. On the login page, type:
--        email:    test
--        password: test
--  The login form maps the literal "test" to test@guerilla.test (see
--  src/app/login/page.tsx), so you never have to type the full address.
--
--  NOTE: this is a *shared* account with a trivial password — fine for
--  testing, but delete it (bottom of this file) before you rely on the
--  registry for anything real, or anyone who guesses "test/test" can log in.
-- =====================================================================

-- pgcrypto (crypt/gen_salt/gen_random_uuid) is already enabled on Supabase.

do $$
declare
  uid uuid;
begin
  -- 1. The auth user (email pre-confirmed so no email link is needed).
  select id into uid from auth.users where email = 'test@guerilla.test';

  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      uid,
      'authenticated', 'authenticated', 'test@guerilla.test',
      crypt('test', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Test User"}'::jsonb,
      now(), now()
    );
    -- The on_auth_user_created trigger inserts the matching public.profiles row.
  end if;

  -- 2. The email identity (modern GoTrue needs this for password sign-in).
  if not exists (
    select 1 from auth.identities
    where user_id = uid and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    )
    values (
      uid::text, uid,
      jsonb_build_object('sub', uid::text, 'email', 'test@guerilla.test', 'email_verified', true),
      'email', now(), now(), now()
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- To REMOVE the test user later, run just this line (cascades to their
-- profile, trees, care logs and photos):
--
--   delete from auth.users where email = 'test@guerilla.test';
-- ---------------------------------------------------------------------
