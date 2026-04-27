-- One-shot price update: vacuum extra buttons, dry-fog machine, washer-fluid dispenser.
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.
-- Idempotent: re-running just rewrites the same values.

-- 1) Vacuum extra buttons (Воздух / Чернитель / Химчистка) — update sub_options on every vacuum row
UPDATE extra_equipment
SET sub_options = jsonb_set(
  COALESCE(sub_options, '{}'::jsonb),
  '{extraButtons}',
  '[
    {"id": "air_btn",          "name": "Воздух",                "price": 20000, "defaultOn": false},
    {"id": "blackener_btn",    "name": "Чернитель",             "price": 38000, "defaultOn": false},
    {"id": "dry_cleaning_btn", "name": "Химчистка (торнадор)",  "price": 55000, "defaultOn": false}
  ]'::jsonb,
  true
)
WHERE category = 'vacuum';

-- 2) Dry-fog machine — base price 250 000 ₽ + each extra scent 25 000 ₽
UPDATE extra_equipment
SET
  price = 250000,
  sub_options = jsonb_set(
    COALESCE(sub_options, '{}'::jsonb),
    '{extraScents}',
    '[
      {"id": "fog_scent_3", "name": "Запах 3", "price": 25000, "defaultOn": false},
      {"id": "fog_scent_4", "name": "Запах 4", "price": 25000, "defaultOn": false},
      {"id": "fog_scent_5", "name": "Запах 5", "price": 25000, "defaultOn": false}
    ]'::jsonb,
    true
  )
WHERE id = 'wash_extra__dry_fog_machine';

-- 3) Washer-fluid dispenser — base price 310 000 ₽
UPDATE extra_equipment
SET price = 310000
WHERE id = 'wash_extra__washer_fluid_dispenser';
