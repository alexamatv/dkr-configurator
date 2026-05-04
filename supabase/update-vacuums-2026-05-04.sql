-- Refresh wash-mounted vacuum lineup (Шаг 9 «Уличное оборудование»):
--   - real prices for the previously placeholder-priced rows;
--   - clearer model names (Elsea / Zero / РОБОКОП);
--   - new 4-th option «Пылесос 2-постовой ТОП Zero».
--
-- IDs match dataService's `VACUUM_PREFIX = 'vacuum__'`. The calculator strips
-- the prefix, so the runtime id stays as in mockData (single / double /
-- double_zero / double_premium).
--
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.
-- Idempotent: ON CONFLICT updates name + price.

INSERT INTO extra_equipment (id, branch, category, name, price, selection_type, sub_options, sort_order, is_active)
VALUES
  ('vacuum__single',         'mso', 'vacuum', 'Пылесос 1-постовой',                                   235000, 'radio', '[]'::jsonb, 10, true),
  ('vacuum__double',         'mso', 'vacuum', 'Пылесос 2-постовой ТОП Elsea (Стандартный)',           375000, 'radio', '[]'::jsonb, 20, true),
  ('vacuum__double_zero',    'mso', 'vacuum', 'Пылесос 2-постовой ТОП Zero',                          349000, 'radio', '[]'::jsonb, 30, true),
  ('vacuum__double_premium', 'mso', 'vacuum', 'Пылесос 2-постовой Премиум Elsea (РОБОКОП)',           455000, 'radio', '[]'::jsonb, 40, true)
ON CONFLICT (id) DO UPDATE SET
  branch         = EXCLUDED.branch,
  category       = EXCLUDED.category,
  name           = EXCLUDED.name,
  price          = EXCLUDED.price,
  selection_type = EXCLUDED.selection_type,
  sort_order     = EXCLUDED.sort_order,
  is_active      = true;
