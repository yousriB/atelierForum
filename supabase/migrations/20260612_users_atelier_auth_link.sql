-- =============================================================================
-- Migration: link users_atelier to Supabase Auth (auth.users) by UUID
-- Date: 2026-06-12
--
-- Goal — mirror the Sales Dashboard pattern:
--   - users_atelier.id IS the same UUID as auth.users.id
--   - passwords live ONLY in auth.users (never in public.users_atelier)
--   - cascade delete: removing an auth user removes the matching profile row
--
-- Pre-conditions:
--   - Every email in public.users_atelier already has a matching row in
--     auth.users. (We abort otherwise — see step 1.)
--
-- Run this as a service-role (superuser) connection — only that role can
-- read from auth.users and create FKs against it.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Safety check — abort if any profile row has no matching auth user.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  missing_count int;
  missing_emails text;
BEGIN
  SELECT count(*), string_agg(email, ', ')
    INTO missing_count, missing_emails
  FROM public.users_atelier u
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE lower(au.email) = lower(u.email)
  );

  IF missing_count > 0 THEN
    RAISE EXCEPTION
      'Migration aborted: % users_atelier row(s) have no matching auth.users entry by email (%). Create those auth users first, then re-run.',
      missing_count, missing_emails;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Safety check — abort if any other table FKs into users_atelier.id.
--    If you DO have such tables, drop their FKs manually before running,
--    then re-add them after the migration with the new uuid type.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  dependent_fk text;
BEGIN
  SELECT string_agg(
    format('%I.%I (%I)', n.nspname, c.relname, conname),
    ', '
  )
    INTO dependent_fk
  FROM pg_constraint con
  JOIN pg_class c          ON c.oid = con.conrelid
  JOIN pg_namespace n      ON n.oid = c.relnamespace
  JOIN pg_class ref        ON ref.oid = con.confrelid
  JOIN pg_namespace ref_ns ON ref_ns.oid = ref.relnamespace
  WHERE con.contype = 'f'
    AND ref_ns.nspname = 'public'
    AND ref.relname   = 'users_atelier'
    AND NOT (n.nspname = 'public' AND c.relname = 'users_atelier'); -- ignore self

  IF dependent_fk IS NOT NULL THEN
    RAISE EXCEPTION
      'Migration aborted: other tables reference users_atelier.id (%). Drop those FKs first, then re-add them after this migration completes.',
      dependent_fk;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Stage the auth UUID in a temp column, backfilled by email match.
-- ---------------------------------------------------------------------------
ALTER TABLE public.users_atelier
  ADD COLUMN IF NOT EXISTS auth_id uuid;

UPDATE public.users_atelier u
SET    auth_id = au.id
FROM   auth.users au
WHERE  lower(au.email) = lower(u.email);

-- Double-check the backfill before we destroy the old id column.
DO $$
DECLARE unlinked int;
BEGIN
  SELECT count(*) INTO unlinked FROM public.users_atelier WHERE auth_id IS NULL;
  IF unlinked > 0 THEN
    RAISE EXCEPTION 'Migration aborted: % users_atelier rows still have NULL auth_id after backfill.', unlinked;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Replace id with the auth UUID, re-establish the primary key.
-- ---------------------------------------------------------------------------
ALTER TABLE public.users_atelier DROP CONSTRAINT IF EXISTS users_atelier_pkey;
ALTER TABLE public.users_atelier DROP COLUMN id;
ALTER TABLE public.users_atelier RENAME COLUMN auth_id TO id;
ALTER TABLE public.users_atelier ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.users_atelier ADD PRIMARY KEY (id);

-- ---------------------------------------------------------------------------
-- 5. Wire id → auth.users.id with cascade delete.
--    Now deleting an auth user (via supabaseAdmin.auth.admin.deleteUser)
--    automatically removes the matching profile row.
-- ---------------------------------------------------------------------------
ALTER TABLE public.users_atelier
  ADD CONSTRAINT users_atelier_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 6. Drop the plaintext password column. This is the whole point.
-- ---------------------------------------------------------------------------
ALTER TABLE public.users_atelier DROP COLUMN IF EXISTS password;

-- ---------------------------------------------------------------------------
-- 7. Indexes — email lookups remain frequent (AuthContext.fetchProfile).
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS users_atelier_email_idx
  ON public.users_atelier (lower(email));

-- ---------------------------------------------------------------------------
-- 8. Row Level Security
--    Pattern matches the Sales setup: writes go through the service-role
--    admin client (which bypasses RLS), and authenticated users can only
--    read their own row.
-- ---------------------------------------------------------------------------
ALTER TABLE public.users_atelier ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_atelier_select_own ON public.users_atelier;
CREATE POLICY users_atelier_select_own
  ON public.users_atelier FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admin role can read every profile (needed for the Users management page).
-- Detect "admin" by joining back to users_atelier on the caller's auth uid.
DROP POLICY IF EXISTS users_atelier_select_admin ON public.users_atelier;
CREATE POLICY users_atelier_select_admin
  ON public.users_atelier FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users_atelier admin
      WHERE admin.id = auth.uid()
        AND admin.role = 'admin'
    )
  );

-- Inserts / updates / deletes are restricted to the service-role admin
-- client (UsersPage in the app). We deliberately do NOT grant authenticated
-- users INSERT/UPDATE/DELETE rights — RLS denies by default with no policy.

COMMIT;
