-- Admin RLS policies — let authenticated users read every row (active or not)
-- and update any row in the catalog tables.
--
-- Run this once in Supabase Dashboard → SQL Editor → New query → Run.
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
    -- Authenticated SELECT: see inactive rows too (admin needs full visibility)
    EXECUTE format('DROP POLICY IF EXISTS "auth read all" ON %s', t);
    EXECUTE format(
      'CREATE POLICY "auth read all" ON %s FOR SELECT TO authenticated USING (true)',
      t
    );

    -- Authenticated UPDATE: any row, any column except id/created_at
    EXECUTE format('DROP POLICY IF EXISTS "auth update all" ON %s', t);
    EXECUTE format(
      'CREATE POLICY "auth update all" ON %s FOR UPDATE TO authenticated USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;
