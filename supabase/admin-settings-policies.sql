-- Lets the admin SettingsPanel write into the app_settings table.
-- Public read is already in place from the original schema.
--
-- Also seeds a `eur_rub_rate` setting for the Truck-tab currency input.
--
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.
-- Idempotent: safe to re-run.

DROP POLICY IF EXISTS "auth update settings" ON app_settings;
CREATE POLICY "auth update settings" ON app_settings
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO app_settings (key, value, description) VALUES
  ('eur_rub_rate', '100'::jsonb, 'Курс EUR/RUB для пересчёта прайса грузовых моек')
ON CONFLICT (key) DO NOTHING;
