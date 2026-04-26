-- DKR Calculator — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query

-- ─── Enums ───
DO $$ BEGIN
  CREATE TYPE branch_type AS ENUM ('mso', 'robot', 'truck');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Profiles (Старт / Стандарт / Премиум) ───
CREATE TABLE IF NOT EXISTS profiles (
  id text PRIMARY KEY,                           -- 'start', 'standard', 'premium'
  branch branch_type NOT NULL DEFAULT 'mso',
  name text NOT NULL,
  description text,
  base_price numeric(12,2) NOT NULL DEFAULT 0,   -- raw equipment cost
  price numeric(12,2) NOT NULL DEFAULT 0,        -- bundle price (with default acc/avd/payments)
  included_components jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_accessories jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_avd text,
  default_bum text,
  default_payments jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  show_image_in_kp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── BUM models (terminals) ───
CREATE TABLE IF NOT EXISTS bum_models (
  id text PRIMARY KEY,                           -- 'model_3', 'model_20', etc.
  name text NOT NULL,
  description text,
  real_price numeric(12,2) NOT NULL DEFAULT 0,
  upgrade_price numeric(12,2) NOT NULL DEFAULT 0, -- delta vs default profile BUM
  max_buttons int NOT NULL DEFAULT 0,
  max_functions int NOT NULL DEFAULT 12,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  show_image_in_kp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Accessories ───
CREATE TABLE IF NOT EXISTS accessories (
  id text PRIMARY KEY,
  branch branch_type NOT NULL DEFAULT 'mso',
  name text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  included_in_profiles jsonb NOT NULL DEFAULT '[]'::jsonb,  -- array of profile ids
  has_custom_price boolean NOT NULL DEFAULT false,          -- e.g. РВД hoses with manual price
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  show_image_in_kp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── AVD pumps ───
CREATE TABLE IF NOT EXISTS pumps (
  id text PRIMARY KEY,
  branch branch_type NOT NULL DEFAULT 'mso',
  name text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  default_for_profile text REFERENCES profiles(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  show_image_in_kp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Wash functions (base + extra) ───
CREATE TABLE IF NOT EXISTS wash_functions (
  id text PRIMARY KEY,
  branch branch_type NOT NULL DEFAULT 'mso',
  name text NOT NULL,
  category text NOT NULL,                        -- 'base' or 'extra'
  is_base boolean NOT NULL DEFAULT false,
  premium_only boolean NOT NULL DEFAULT false,
  button_price numeric(12,2) NOT NULL DEFAULT 0,
  kit_price numeric(12,2) NOT NULL DEFAULT 0,
  requires_dosator boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  show_image_in_kp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Water treatment (Osmos + ARAS) ───
CREATE TABLE IF NOT EXISTS water_treatment (
  id text PRIMARY KEY,
  type text NOT NULL,                            -- 'osmosis' or 'aras'
  name text NOT NULL,
  capacity text,                                 -- e.g. '500 л/сут'
  level text,                                    -- ARAS level
  price numeric(12,2) NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  show_image_in_kp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Extra equipment (vacuum, dispenser, fogger, wash extras) ───
CREATE TABLE IF NOT EXISTS extra_equipment (
  id text PRIMARY KEY,
  branch branch_type NOT NULL DEFAULT 'mso',
  category text NOT NULL,                        -- 'vacuum', 'dispenser', 'fogger', 'wash_extra', 'post_extra'
  name text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  selection_type text NOT NULL DEFAULT 'checkbox', -- 'radio' | 'checkbox'
  sub_options jsonb NOT NULL DEFAULT '[]'::jsonb,  -- payment/buttons/scents config
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  show_image_in_kp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Robot models ───
CREATE TABLE IF NOT EXISTS robot_models (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  included_components jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  show_image_in_kp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── BUR models (control units, used by robot + truck) ───
CREATE TABLE IF NOT EXISTS bur_models (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  branch branch_type,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  show_image_in_kp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Truck wash types (КОМПАК / SmartBot Track) ───
CREATE TABLE IF NOT EXISTS truck_wash_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  show_image_in_kp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Settings (montage rates, fx rates, defaults) ───
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default settings
INSERT INTO app_settings (key, value, description) VALUES
  ('montage_full_pct', '0.10'::jsonb, 'Montage rate for МСО — full installation'),
  ('montage_commissioning_pct', '0.05'::jsonb, 'Montage rate for МСО — commissioning only'),
  ('montage_robot_fixed', '370000'::jsonb, 'Fixed montage price for robot branch'),
  ('montage_kompak_fixed', '350000'::jsonb, 'Fixed montage price for КОМПАК truck wash'),
  ('default_discount', '0'::jsonb, 'Default discount % on new estimates'),
  ('default_vat', '22'::jsonb, 'Default VAT %')
ON CONFLICT (key) DO NOTHING;

-- ─── User roles ───
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'manager',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Audit log ───
CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  table_name text NOT NULL,
  row_id text NOT NULL,
  action text NOT NULL,                          -- 'insert' | 'update' | 'delete'
  diff jsonb,                                    -- {before, after}
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name, row_id);

-- ─── updated_at auto trigger ───
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles', 'bum_models', 'accessories', 'pumps', 'wash_functions',
    'water_treatment', 'extra_equipment', 'robot_models', 'bur_models',
    'truck_wash_types'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;

-- ─── Row-Level Security ───
-- Public read on catalog tables (calculator needs to fetch them anonymously)
-- Writes only via service_role key (used by admin endpoints) — RLS blocks anon writes

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bum_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE wash_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_treatment ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE robot_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE bur_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_wash_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Public read for active catalog rows
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles', 'bum_models', 'accessories', 'pumps', 'wash_functions',
    'water_treatment', 'extra_equipment', 'robot_models', 'bur_models',
    'truck_wash_types'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public read active" ON %s', t);
    EXECUTE format('CREATE POLICY "public read active" ON %s FOR SELECT USING (is_active = true)', t);
  END LOOP;
END $$;

-- Settings: public read
DROP POLICY IF EXISTS "public read settings" ON app_settings;
CREATE POLICY "public read settings" ON app_settings FOR SELECT USING (true);

-- user_roles: each user reads their own row
DROP POLICY IF EXISTS "self read role" ON user_roles;
CREATE POLICY "self read role" ON user_roles FOR SELECT USING (auth.uid() = user_id);

-- audit_log: only authenticated admins can read; everyone blocked from writing via anon
DROP POLICY IF EXISTS "admin read audit" ON audit_log;
CREATE POLICY "admin read audit" ON audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
