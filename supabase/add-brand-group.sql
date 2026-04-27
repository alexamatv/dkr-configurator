-- Add `brand_group` + `brand` columns on wash_functions and backfill the
-- existing SEKO / ULKA pairs so the calculator can group them by data
-- instead of by id-suffix parsing.
--
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.
-- Idempotent: safe to re-run.

ALTER TABLE wash_functions ADD COLUMN IF NOT EXISTS brand_group TEXT;
ALTER TABLE wash_functions ADD COLUMN IF NOT EXISTS brand TEXT;

-- Backfill existing rows (only the ones that match the seeded ids)
UPDATE wash_functions SET brand_group = 'active_chem', brand = 'seko' WHERE id = 'active_chem_seko';
UPDATE wash_functions SET brand_group = 'active_chem', brand = 'ulka' WHERE id = 'active_chem_ulka';
UPDATE wash_functions SET brand_group = 'degreaser',   brand = 'seko' WHERE id = 'degreaser_seko';
UPDATE wash_functions SET brand_group = 'degreaser',   brand = 'ulka' WHERE id = 'degreaser_ulka';
