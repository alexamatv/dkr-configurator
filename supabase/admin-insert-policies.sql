-- Authenticated INSERT policies for the 10 catalog tables.
-- (SELECT and UPDATE policies are already in place from earlier migrations.)
-- Soft delete is handled via UPDATE is_active = false, so no DELETE policy is
-- needed — physical deletion is intentionally not allowed from the admin UI.
--
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.
-- Idempotent: safe to re-run.

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles', 'bum_models', 'accessories', 'pumps', 'wash_functions',
    'water_treatment', 'extra_equipment', 'robot_models', 'bur_models',
    'truck_wash_types'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth insert" ON %s', t);
    EXECUTE format(
      'CREATE POLICY "auth insert" ON %s FOR INSERT TO authenticated WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;
