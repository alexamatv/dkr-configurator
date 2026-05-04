-- Backfill `extra_equipment` with robot extras + Kompak options so the
-- Robot and Truck admin tabs have content to manage. Idempotent — re-running
-- updates the same rows in place.
--
-- After running, the calculator still pulls these from mockData.ts; the
-- DB-driven wiring will land in a follow-up. Admin can already edit prices
-- via /admin/prices for staging.

INSERT INTO extra_equipment (id, branch, category, name, price, selection_type, sub_options, sort_order, is_active)
VALUES
  -- ── Robot extras (mockData.robotExtraEquipment) ──
  ('robot_extra__foam_lava',       'robot', 'robot_extra', 'Пена лава',                        220000, 'checkbox', '[]'::jsonb,  10, true),
  ('robot_extra__extra_chem',      'robot', 'robot_extra', 'Доп. вид химии',                    50000, 'checkbox', '[]'::jsonb,  20, true),
  ('robot_extra__underbody_wash',  'robot', 'robot_extra', 'Мойка днища',                      120000, 'checkbox', '[]'::jsonb,  30, true),
  ('robot_extra__side_wash',       'robot', 'robot_extra', 'Боковая мойка',                     75000, 'checkbox', '[]'::jsonb,  40, true),
  ('robot_extra__belt_protection', 'robot', 'robot_extra', 'Защита обрыва ремня',               75000, 'checkbox', '[]'::jsonb,  50, true),
  ('robot_extra__side_dryer',      'robot', 'robot_extra', 'Боковая сушка',                    250000, 'checkbox', '[]'::jsonb,  60, true),
  ('robot_extra__motor_22kw',      'robot', 'robot_extra', 'Двигатель 22,5 кВт',                80000, 'checkbox', '[]'::jsonb,  70, true),
  ('robot_extra__dry_run_control', 'robot', 'robot_extra', 'Контроль сухого хода помпы',        40000, 'checkbox', '[]'::jsonb,  80, true),

  -- ── Kompak truck options (mockData.kompakOptions) ──
  ('kompak_option__active_chem',   'truck', 'kompak_option', 'Система нанесения активной химии', 1010000, 'checkbox', '[]'::jsonb,  10, true),
  ('kompak_option__lower_hd',      'truck', 'kompak_option', 'Нижний контур высокого давления',   452000, 'checkbox', '[]'::jsonb,  20, true),
  ('kompak_option__underbody',     'truck', 'kompak_option', 'Мойка днища высоким давлением',     764000, 'checkbox', '[]'::jsonb,  30, true),
  ('kompak_option__hd_block',      'truck', 'kompak_option', 'Блок высокого давления 16.5 кВт',  1073000, 'checkbox', '[]'::jsonb,  40, true),
  ('kompak_option__wax',           'truck', 'kompak_option', 'Нанесение воска',                    58000, 'checkbox', '[]'::jsonb,  50, true),
  ('kompak_option__filter',        'truck', 'kompak_option', 'Магистральный фильтр с промывкой',   32000, 'checkbox', '[]'::jsonb,  60, true),
  ('kompak_option__emergency_btn', 'truck', 'kompak_option', 'Доп. кнопка аварийного отключения',  21000, 'checkbox', '[]'::jsonb,  70, true)
ON CONFLICT (id) DO UPDATE SET
  branch         = EXCLUDED.branch,
  category       = EXCLUDED.category,
  name           = EXCLUDED.name,
  price          = EXCLUDED.price,
  selection_type = EXCLUDED.selection_type,
  sort_order     = EXCLUDED.sort_order;
