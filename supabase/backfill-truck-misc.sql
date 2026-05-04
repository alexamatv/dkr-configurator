-- Backfill the remaining hard-coded truck/МСО values into Supabase so the
-- admin can manage them too. Idempotent: ON CONFLICT updates.
--
-- After running, the calculator reads these via DataContext (truckManualPost,
-- truckWaterSystems, getSetting('booster_pump_price', 53000), etc.).

-- ── Two new app_settings: booster pump price + truck manual-post montage ──
INSERT INTO app_settings (key, value, description) VALUES
  ('booster_pump_price',         '53000'::jsonb,  'Цена станции повышения давления (МСО, Шаг 7)'),
  ('truck_manual_post_montage',  '200000'::jsonb, 'Монтаж ручного поста на грузовой мойке')
ON CONFLICT (key) DO NOTHING;

-- ── Truck manual-post equipment (АВД + кабельный подвес) — extra_equipment, branch=truck, category=truck_manual_post
INSERT INTO extra_equipment (id, branch, category, name, price, selection_type, sub_options, sort_order, is_active)
VALUES
  ('truck_manual_post__avd',          'truck', 'truck_manual_post', 'АВД 250 бар, 7.5 кВт (комплект)', 125000, 'checkbox', '[]'::jsonb, 10, true),
  ('truck_manual_post__cable_hanger', 'truck', 'truck_manual_post', 'Кабельный подвес 24м',           135000, 'checkbox', '[]'::jsonb, 20, true)
ON CONFLICT (id) DO UPDATE SET
  branch         = EXCLUDED.branch,
  category       = EXCLUDED.category,
  name           = EXCLUDED.name,
  price          = EXCLUDED.price,
  selection_type = EXCLUDED.selection_type,
  sort_order     = EXCLUDED.sort_order;

-- ── Truck water systems (Циклон / АРОС / Не нужно / Своя стоимость) — extra_equipment, branch=truck, category=truck_water
-- 'none' and 'custom' carry semantic meaning in the UI (free price entry / nothing selected)
INSERT INTO extra_equipment (id, branch, category, name, price, selection_type, sub_options, sort_order, is_active)
VALUES
  ('truck_water__none',     'truck', 'truck_water', 'Не нужно',              0,       'radio', '[]'::jsonb, 10, true),
  ('truck_water__cyclone7', 'truck', 'truck_water', 'Циклон 7 (7 м³/час)',   5250000, 'radio', '[]'::jsonb, 20, true),
  ('truck_water__aros5',    'truck', 'truck_water', 'АРОС 5 (5 м³/час)',     180000,  'radio', '[]'::jsonb, 30, true),
  ('truck_water__custom',   'truck', 'truck_water', 'Своя стоимость',        0,       'radio', '[]'::jsonb, 40, true)
ON CONFLICT (id) DO UPDATE SET
  branch         = EXCLUDED.branch,
  category       = EXCLUDED.category,
  name           = EXCLUDED.name,
  price          = EXCLUDED.price,
  selection_type = EXCLUDED.selection_type,
  sort_order     = EXCLUDED.sort_order;
