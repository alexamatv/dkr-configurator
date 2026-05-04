-- Post-mounted vacuum cleaners (Шаг 8: «Пылесос на терминал»).
-- Radio choice — only one per post — and the selected cost is multiplied by
-- the post count in the calculator + KP exports.
--
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.
-- Idempotent: ON CONFLICT updates.

INSERT INTO extra_equipment (id, branch, category, name, price, selection_type, sub_options, sort_order, is_active)
VALUES
  ('post_vacuum__elsea_basket',   'mso', 'post_vacuum', 'Пылесос на терминал 3,3 кВт в корзине (Elsea)',     90000,  'radio', '[]'::jsonb, 10, true),
  ('post_vacuum__elsea_rolling',  'mso', 'post_vacuum', 'Пылесос на терминал 3,3 кВт Перекатной (Elsea)',     65000,  'radio', '[]'::jsonb, 20, true),
  ('post_vacuum__china_basket',   'mso', 'post_vacuum', 'Пылесос на терминал 3,3 кВт в корзине (Китайский)',  70000,  'radio', '[]'::jsonb, 30, true),
  ('post_vacuum__china_rolling',  'mso', 'post_vacuum', 'Пылесос на терминал 3,3 кВт Перекатной (Китайский)', 40000,  'radio', '[]'::jsonb, 40, true),
  ('post_vacuum__wall',           'mso', 'post_vacuum', 'Пылесос на терминал 3,3 кВт на стену',               120000, 'radio', '[]'::jsonb, 50, true)
ON CONFLICT (id) DO UPDATE SET
  branch         = EXCLUDED.branch,
  category       = EXCLUDED.category,
  name           = EXCLUDED.name,
  price          = EXCLUDED.price,
  selection_type = EXCLUDED.selection_type,
  sort_order     = EXCLUDED.sort_order;
