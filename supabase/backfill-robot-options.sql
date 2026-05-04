-- Robot wash sub-options (Шаг 4 Робота): payment systems + extra options.
-- One canonical row in extra_equipment with branch='robot', category='robot_options'.
-- The calculator picks up the sub_options jsonb via DataContext and renders
-- a single shared pill list.
--
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.
-- Idempotent: ON CONFLICT updates name + sub_options.

INSERT INTO extra_equipment (id, branch, category, name, price, selection_type, sub_options, sort_order, is_active)
VALUES (
  'robot_options__main',
  'robot',
  'robot_options',
  'Опции терминала робота',
  0,
  'checkbox',
  '{
    "payment": [
      {"id": "robot_bill_acceptor",   "name": "Купюроприёмник",                 "price": 1, "defaultOn": true},
      {"id": "robot_coin_acceptor",   "name": "Монетоприёмник",                 "price": 1, "defaultOn": true},
      {"id": "robot_loyalty_reader",  "name": "Считыватель карт лояльности",    "price": 1, "defaultOn": true},
      {"id": "robot_acquiring",       "name": "Эквайринг",                      "price": 1, "defaultOn": true},
      {"id": "robot_qr_payment",      "name": "QR",                             "price": 1, "defaultOn": true}
    ],
    "baseOptions": [
      {"id": "robot_individual_design", "name": "Индивидуальный дизайн", "price": 1, "defaultOn": false}
    ],
    "extraOptions": []
  }'::jsonb,
  10,
  true
)
ON CONFLICT (id) DO UPDATE SET
  branch         = EXCLUDED.branch,
  category       = EXCLUDED.category,
  name           = EXCLUDED.name,
  selection_type = EXCLUDED.selection_type,
  sub_options    = EXCLUDED.sub_options,
  sort_order     = EXCLUDED.sort_order,
  is_active      = true;
