/**
 * dataService — fetches catalog data from Supabase and maps it to mockData-shaped types.
 *
 * Each function returns the same shape that the calculator components currently expect
 * from `@/data/mockData`, so swapping the source is transparent to downstream code.
 *
 * If the network call fails, callers (DataContext) fall back to mockData.
 */

import { createClient } from '@/lib/supabase/client';
import type {
  ProfileConfig,
  BumModel,
  Accessory,
  PostFunction,
  OsmosOption,
  VacuumOption,
  PostExtra,
  WashExtra,
  RobotModel,
  RobotBurModel,
  PaymentSystem,
  ProfileType,
} from '@/types';

// ─── DB row shapes (loose — only the fields we read) ────────────────────────

// Photo fields shared by every catalog row
type PhotoFields = {
  image_url: string | null;
  show_image_in_kp: boolean | null;
};

type ProfileRow = PhotoFields & {
  id: string;
  name: string;
  description: string | null;
  base_price: number | string;
  price: number | string;
  included_components: unknown;
  default_accessories: unknown;
  default_avd: string | null;
  default_bum: string | null;
  default_payments: unknown;
  sort_order: number;
};

type BumRow = PhotoFields & {
  id: string;
  name: string;
  description: string | null;
  real_price: number | string;
  upgrade_price: number | string;
  max_buttons: number;
  max_functions: number;
  sort_order: number;
};

type AccessoryRow = PhotoFields & {
  id: string;
  name: string;
  price: number | string;
  has_custom_price: boolean;
  sort_order: number;
};

type PumpRow = PhotoFields & {
  id: string;
  name: string;
  price: number | string;
  default_for_profile: string | null;
  sort_order: number;
};

type WashFunctionRow = PhotoFields & {
  id: string;
  name: string;
  category: string;
  is_base: boolean;
  premium_only: boolean;
  button_price: number | string;
  kit_price: number | string;
  requires_dosator: boolean;
  sort_order: number;
  brand_group: string | null;
  brand: string | null;
};

type WaterTreatmentRow = PhotoFields & {
  id: string;
  type: string;
  name: string;
  capacity: string | null;
  level: string | null;
  price: number | string;
  sort_order: number;
};

type ExtraEquipmentRow = PhotoFields & {
  id: string;
  branch: string | null;
  category: string;
  name: string;
  price: number | string;
  selection_type: string;
  sub_options: unknown;
  sort_order: number;
};

type RobotRow = PhotoFields & {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  included_components: unknown;
  sort_order: number;
};

type BurRow = PhotoFields & {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  sort_order: number;
};

type TruckWashRow = PhotoFields & {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  features: unknown;
  sort_order: number;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const num = (v: number | string | null | undefined): number =>
  typeof v === 'number' ? v : Number(v ?? 0);

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const photo = (r: PhotoFields) => ({
  imageUrl: r.image_url ?? undefined,
  showImageInKp: r.show_image_in_kp ?? false,
});

// ─── Service: getters return mockData-shaped data ───────────────────────────

export interface AvdKit {
  id: string;
  name: string;
  price: number;
  premiumOnly?: boolean;
  imageUrl?: string;
  showImageInKp?: boolean;
}

export interface ArasModel {
  id: string;
  name: string;
  price?: number;
  imageUrl?: string;
  showImageInKp?: boolean;
}

export interface TruckWashType {
  id: string;
  name: string;
  price: number;
  currency: 'RUB';
  features: string[];
  imageUrl?: string;
  showImageInKp?: boolean;
}

const PREMIUM_ONLY_AVD_IDS = new Set<string>(['hawk_25_200']);

export async function getProfiles(): Promise<ProfileConfig[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('branch', 'mso')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  return (data as ProfileRow[]).map((r) => ({
    id: r.id as ProfileType,
    name: r.name,
    description: r.description ?? '',
    price: num(r.price),
    basePrice: num(r.base_price),
    defaultAvd: r.default_avd ?? '',
    defaultTerminal: r.default_bum ?? '',
    defaultPayments: arr<PaymentSystem>(r.default_payments),
    defaultAccessories: arr<string>(r.default_accessories),
    includedComponents: arr<string>(r.included_components),
    ...photo(r),
  }));
}

export async function getBumModels(): Promise<BumModel[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bum_models')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  return (data as BumRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    maxButtons: r.max_buttons,
    maxFunctions: r.max_functions,
    price: num(r.upgrade_price),
    realPrice: num(r.real_price),
    ...photo(r),
  }));
}

export async function getAccessories(): Promise<Accessory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('accessories')
    .select('*')
    .eq('branch', 'mso')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  return (data as AccessoryRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    price: num(r.price),
    selected: false,
    // Hose pair is mutually exclusive (preserved from mockData behavior)
    exclusiveGroup: r.id === 'hose_4m' || r.id === 'hose_5m' ? 'hose' : undefined,
    ...photo(r),
  }));
}

export async function getPumps(): Promise<AvdKit[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pumps')
    .select('*')
    .eq('branch', 'mso')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  return (data as PumpRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    price: num(r.price),
    ...(PREMIUM_ONLY_AVD_IDS.has(r.id) ? { premiumOnly: true } : {}),
    ...photo(r),
  }));
}

export interface WashFunctionsResult {
  base: PostFunction[];
  extra: PostFunction[];
}

export async function getWashFunctions(): Promise<WashFunctionsResult> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('wash_functions')
    .select('*')
    .eq('branch', 'mso')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  const base: PostFunction[] = [];
  const extra: PostFunction[] = [];

  for (const r of data as WashFunctionRow[]) {
    const isBase = r.is_base || r.category === 'base';
    const brandFields = {
      ...(r.brand_group ? { brandGroup: r.brand_group } : {}),
      ...(r.brand ? { brand: r.brand } : {}),
    };
    const fn: PostFunction = isBase
      ? {
          id: r.id,
          name: r.name,
          isBase: true,
          enabled: true,
          buttonPrice: num(r.button_price),
          kitPrice: num(r.kit_price),
          ...brandFields,
          ...photo(r),
        }
      : {
          id: r.id,
          name: r.name,
          isBase: false,
          enabled: false,
          option: 'none',
          ...(r.premium_only ? { premiumOnly: true } : {}),
          ...(r.requires_dosator ? { requiresDosator: true } : {}),
          buttonPrice: num(r.button_price),
          kitPrice: num(r.kit_price),
          ...brandFields,
          ...photo(r),
        };
    if (isBase) base.push(fn);
    else extra.push(fn);
  }

  return { base, extra };
}

export interface WaterTreatmentResult {
  osmos: OsmosOption[];
  aras: ArasModel[];
}

export async function getWaterTreatment(): Promise<WaterTreatmentResult> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('water_treatment')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  const osmos: OsmosOption[] = [];
  const aras: ArasModel[] = [];

  for (const r of data as WaterTreatmentRow[]) {
    if (r.type === 'osmosis') {
      osmos.push({
        id: r.id,
        capacity: (r.capacity ?? '500') as OsmosOption['capacity'],
        level: (r.level === 'premium' ? 'premium' : 'standard') as OsmosOption['level'],
        name: r.name,
        price: num(r.price),
        ...photo(r),
      });
    } else if (r.type === 'aras') {
      aras.push({
        id: r.id,
        name: r.name,
        ...(r.id === 'none' ? {} : { price: num(r.price) }),
        ...photo(r),
      });
    }
  }

  return { osmos, aras };
}

export interface SimpleEquipmentItem {
  id: string;
  name: string;
  price: number;
  note?: string;
  imageUrl?: string;
  showImageInKp?: boolean;
}

export interface ExtraEquipmentResult {
  vacuums: VacuumOption[];
  postExtras: PostExtra[];
  washExtras: WashExtra[];
  /** branch='robot', category='robot_extra' — robotExtraEquipment in mockData */
  robotExtras: SimpleEquipmentItem[];
  /** branch='truck', category='kompak_option' — kompakOptions in mockData */
  kompakOptions: SimpleEquipmentItem[];
  /** branch='truck', category='truck_manual_post' — АВД + кабельный подвес */
  truckManualPost: SimpleEquipmentItem[];
  /** branch='truck', category='truck_water' — Циклон / АРОС / Не нужно / Своя стоимость */
  truckWaterSystems: SimpleEquipmentItem[];
}

const VACUUM_PREFIX = 'vacuum__';
const POST_EXTRA_PREFIX = 'post_extra__';
const WASH_EXTRA_PREFIX = 'wash_extra__';
const ROBOT_EXTRA_PREFIX = 'robot_extra__';
const KOMPAK_OPTION_PREFIX = 'kompak_option__';
const TRUCK_MANUAL_POST_PREFIX = 'truck_manual_post__';
const TRUCK_WATER_PREFIX = 'truck_water__';

const stripPrefix = (id: string, prefix: string): string =>
  id.startsWith(prefix) ? id.slice(prefix.length) : id;

export async function getExtraEquipment(): Promise<ExtraEquipmentResult> {
  const supabase = createClient();
  // Load every branch in one round-trip — we split client-side. This keeps
  // the calculator + admin reads symmetric and lets robot/truck branches
  // pick up their own catalog without a second query.
  const { data, error } = await supabase
    .from('extra_equipment')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  const vacuums: VacuumOption[] = [];
  const postExtras: PostExtra[] = [];
  const washExtras: WashExtra[] = [];
  const robotExtras: SimpleEquipmentItem[] = [];
  const kompakOptions: SimpleEquipmentItem[] = [];
  const truckManualPost: SimpleEquipmentItem[] = [];
  const truckWaterSystems: SimpleEquipmentItem[] = [];

  for (const r of data as ExtraEquipmentRow[]) {
    if (r.branch === 'robot' && r.category === 'robot_extra') {
      robotExtras.push({
        id: stripPrefix(r.id, ROBOT_EXTRA_PREFIX),
        name: r.name,
        price: num(r.price),
        ...photo(r),
      });
      continue;
    }
    if (r.branch === 'truck' && r.category === 'kompak_option') {
      kompakOptions.push({
        id: stripPrefix(r.id, KOMPAK_OPTION_PREFIX),
        name: r.name,
        price: num(r.price),
        ...photo(r),
      });
      continue;
    }
    if (r.branch === 'truck' && r.category === 'truck_manual_post') {
      truckManualPost.push({
        id: stripPrefix(r.id, TRUCK_MANUAL_POST_PREFIX),
        name: r.name,
        price: num(r.price),
        ...photo(r),
      });
      continue;
    }
    if (r.branch === 'truck' && r.category === 'truck_water') {
      truckWaterSystems.push({
        id: stripPrefix(r.id, TRUCK_WATER_PREFIX),
        name: r.name,
        price: num(r.price),
        ...photo(r),
      });
      continue;
    }
    // Everything else is treated as МСО content (current calculator only
    // surfaces these on Шаги 8/9). Skip non-mso to avoid leaking truck
    // rows into МСО dropdowns.
    if (r.branch !== 'mso') continue;

    if (r.category === 'vacuum') {
      vacuums.push({
        id: stripPrefix(r.id, VACUUM_PREFIX),
        name: r.name,
        price: num(r.price),
        ...photo(r),
      });
    } else if (r.category === 'post_extra') {
      postExtras.push({
        id: stripPrefix(r.id, POST_EXTRA_PREFIX),
        name: r.name,
        selected: false,
        quantity: 0,
        price: num(r.price),
        ...photo(r),
      });
    } else {
      // wash_extra | dispenser | fogger — all rendered together in Step9 wash extras list
      washExtras.push({
        id: stripPrefix(r.id, WASH_EXTRA_PREFIX),
        name: r.name,
        selected: false,
        quantity: 0,
        price: num(r.price),
        ...photo(r),
      });
    }
  }

  // Vacuum list always exposes a "none" radio option (UI requirement)
  if (!vacuums.find((v) => v.id === 'none')) {
    vacuums.push({ id: 'none', name: 'Нет', price: 0 });
  }

  return { vacuums, postExtras, washExtras, robotExtras, kompakOptions, truckManualPost, truckWaterSystems };
}

/**
 * Reads the app_settings k-v table into a plain Map. Values are JSONB
 * scalars (numbers); anything that doesn't parse as a number is dropped.
 */
export async function getSettings(): Promise<Map<string, number>> {
  const supabase = createClient();
  const { data, error } = await supabase.from('app_settings').select('key, value');
  if (error) throw error;
  const map = new Map<string, number>();
  for (const r of (data ?? []) as { key: string; value: unknown }[]) {
    const n = typeof r.value === 'number' ? r.value : Number(r.value);
    if (Number.isFinite(n)) map.set(r.key, n);
  }
  return map;
}

export async function getRobotModels(): Promise<RobotModel[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('robot_models')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  return (data as RobotRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    price: num(r.price),
    includedComponents: arr<string>(r.included_components),
    ...photo(r),
  }));
}

export async function getBurModels(): Promise<RobotBurModel[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bur_models')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  return (data as BurRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    price: num(r.price),
    ...photo(r),
  }));
}

export async function getTruckWashTypes(): Promise<TruckWashType[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('truck_wash_types')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  return (data as TruckWashRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    price: num(r.price),
    currency: 'RUB',
    features: arr<string>(r.features),
    ...photo(r),
  }));
}
