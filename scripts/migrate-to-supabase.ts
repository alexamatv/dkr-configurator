/**
 * One-shot migration script: copies mockData.ts into Supabase tables.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-supabase.ts
 *
 * Requirements:
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY
 *   - schema.sql already executed in Supabase Dashboard → SQL Editor
 *
 * Idempotent: uses upsert by primary key, so running twice is safe.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import {
  profiles,
  bumModels,
  defaultAccessories,
  avdKits,
  defaultBaseFunctions,
  defaultExtraFunctions,
  osmosOptions,
  arasModels,
  vacuumOptions,
  defaultWashExtras,
  defaultPostExtras,
  vacuumSubOptionsConfig,
  dispenserSubOptionsConfig,
  foggerSubOptionsConfig,
  robotModels,
  burModels,
  truckWashTypes,
} from '../src/data/mockData';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function upsert(table: string, rows: unknown[], conflictKey = 'id') {
  if (rows.length === 0) {
    console.log(`  ↪ ${table}: 0 rows (skipped)`);
    return;
  }
  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflictKey });
  if (error) {
    console.error(`❌ ${table} upsert failed:`, error.message);
    throw error;
  }
  console.log(`  ✓ ${table}: ${rows.length} rows`);
}

const defaultBumByProfile: Record<string, string> = {
  start: 'model_20',
  standard: 'model_20',
  premium: 'model_13',
};

// ─── Migrations ─────────────────────────────────────────────────────────────

async function migrateProfiles() {
  console.log('→ profiles');
  const rows = profiles.map((p, i) => ({
    id: p.id,
    branch: 'mso',
    name: p.name,
    description: p.description,
    base_price: p.basePrice,
    price: p.price,
    included_components: p.includedComponents,
    default_accessories: p.defaultAccessories,
    default_avd: p.defaultAvd,
    default_bum: defaultBumByProfile[p.id] ?? null,
    default_payments: p.defaultPayments ?? [],
    sort_order: i,
    is_active: true,
  }));
  await upsert('profiles', rows);
}

async function migrateBumModels() {
  console.log('→ bum_models');
  const rows = bumModels.map((b, i) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    real_price: b.realPrice,
    upgrade_price: b.price, // legacy "swap" delta
    max_buttons: b.maxButtons,
    max_functions: b.maxFunctions,
    sort_order: i,
    is_active: true,
  }));
  await upsert('bum_models', rows);
}

async function migrateAccessories() {
  console.log('→ accessories');
  // included_in_profiles is derived from profiles[].defaultAccessories
  const includedMap: Record<string, string[]> = {};
  for (const p of profiles) {
    for (const accId of p.defaultAccessories ?? []) {
      if (!includedMap[accId]) includedMap[accId] = [];
      includedMap[accId].push(p.id);
    }
  }

  const rows = defaultAccessories.map((a, i) => ({
    id: a.id,
    branch: 'mso',
    name: a.name,
    price: a.price,
    included_in_profiles: includedMap[a.id] ?? [],
    has_custom_price: a.customPrice !== undefined,
    sort_order: i,
    is_active: true,
  }));
  await upsert('accessories', rows);
}

async function migratePumps() {
  console.log('→ pumps');
  // Find which AVD is default for which profile
  const defaultByAvd: Record<string, string> = {};
  for (const p of profiles) {
    if (p.defaultAvd) defaultByAvd[p.defaultAvd] = p.id;
  }

  const rows = avdKits.map((a, i) => ({
    id: a.id,
    branch: 'mso',
    name: a.name,
    price: a.price,
    default_for_profile: defaultByAvd[a.id] ?? null,
    sort_order: i,
    is_active: true,
  }));
  await upsert('pumps', rows);
}

async function migrateWashFunctions() {
  console.log('→ wash_functions');
  const all = [...defaultBaseFunctions, ...defaultExtraFunctions];
  const rows = all.map((f, i) => ({
    id: f.id,
    branch: 'mso',
    name: f.name,
    category: f.isBase ? 'base' : 'extra',
    is_base: f.isBase,
    premium_only: f.premiumOnly ?? false,
    button_price: f.buttonPrice ?? 0,
    kit_price: f.kitPrice ?? 0,
    requires_dosator: f.requiresDosator ?? false,
    sort_order: i,
    is_active: true,
  }));
  await upsert('wash_functions', rows);
}

async function migrateWaterTreatment() {
  console.log('→ water_treatment');
  const osmosRows = osmosOptions.map((o, i) => ({
    id: o.id,
    type: 'osmosis',
    name: o.name,
    capacity: o.capacity ?? null,
    level: null,
    price: o.price,
    sort_order: i,
    is_active: true,
  }));

  const arasRows = arasModels.map((a, i) => ({
    id: a.id,
    type: 'aras',
    name: a.name,
    capacity: null,
    level: 'level' in a ? String(a.level ?? '') : null,
    price: 'price' in a ? Number((a as { price: number }).price) : 0,
    sort_order: 1000 + i,
    is_active: true,
  }));

  await upsert('water_treatment', [...osmosRows, ...arasRows]);
}

async function migrateExtraEquipment() {
  console.log('→ extra_equipment');
  const rows: Record<string, unknown>[] = [];

  // Vacuums (radio)
  vacuumOptions.forEach((v, i) => {
    if (v.id === 'none') return;
    rows.push({
      id: `vacuum__${v.id}`,
      branch: 'mso',
      category: 'vacuum',
      name: v.name,
      price: v.price,
      selection_type: 'radio',
      sub_options: {
        payment: vacuumSubOptionsConfig.payment,
        baseButtons: vacuumSubOptionsConfig.baseButtons,
        extraButtons: vacuumSubOptionsConfig.extraButtons,
      },
      sort_order: i,
      is_active: true,
    });
  });

  // Wash extras (checkboxes)
  defaultWashExtras.forEach((e, i) => {
    const isDispenser = e.id === 'washer_fluid_dispenser';
    const isFogger = e.id === 'dry_fog_machine';
    rows.push({
      id: `wash_extra__${e.id}`,
      branch: 'mso',
      category: isDispenser ? 'dispenser' : isFogger ? 'fogger' : 'wash_extra',
      name: e.name,
      price: e.price,
      selection_type: 'checkbox',
      sub_options: isDispenser
        ? {
            payment: dispenserSubOptionsConfig.payment,
            baseButtons: dispenserSubOptionsConfig.baseButtons,
            extraButtons: dispenserSubOptionsConfig.extraButtons,
          }
        : isFogger
          ? {
              payment: foggerSubOptionsConfig.payment,
              baseScents: foggerSubOptionsConfig.baseScents,
              extraScents: foggerSubOptionsConfig.extraScents,
            }
          : [],
      sort_order: 100 + i,
      is_active: true,
    });
  });

  // Post extras (Step 8)
  defaultPostExtras.forEach((e, i) => {
    rows.push({
      id: `post_extra__${e.id}`,
      branch: 'mso',
      category: 'post_extra',
      name: e.name,
      price: e.price,
      selection_type: 'checkbox',
      sub_options: [],
      sort_order: 200 + i,
      is_active: true,
    });
  });

  await upsert('extra_equipment', rows);
}

async function migrateRobots() {
  console.log('→ robot_models');
  const rows = robotModels.map((r, i) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    price: r.price,
    included_components: r.includedComponents ?? [],
    sort_order: i,
    is_active: true,
  }));
  await upsert('robot_models', rows);
}

async function migrateBurs() {
  console.log('→ bur_models');
  const rows = burModels.map((b, i) => ({
    id: b.id,
    name: b.name,
    description: b.description ?? null,
    price: b.price,
    branch: null,
    sort_order: i,
    is_active: true,
  }));
  await upsert('bur_models', rows);
}

async function migrateTruckWashTypes() {
  console.log('→ truck_wash_types');
  const rows = truckWashTypes.map((t, i) => ({
    id: t.id,
    name: t.name,
    description: null,
    price: t.price,
    features: t.features ?? [],
    sort_order: i,
    is_active: true,
  }));
  await upsert('truck_wash_types', rows);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Migrating mockData.ts → Supabase\n');

  try {
    // Migrate base entities first (FK constraints)
    await migrateProfiles();
    await migrateBumModels();
    await migrateAccessories();
    await migratePumps();
    await migrateWashFunctions();
    await migrateWaterTreatment();
    await migrateExtraEquipment();
    await migrateRobots();
    await migrateBurs();
    await migrateTruckWashTypes();

    console.log('\n✅ Migration complete.');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

main();
