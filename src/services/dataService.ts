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

type ProfileRow = {
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

type BumRow = {
  id: string;
  name: string;
  description: string | null;
  real_price: number | string;
  upgrade_price: number | string;
  max_buttons: number;
  max_functions: number;
  sort_order: number;
};

type AccessoryRow = {
  id: string;
  name: string;
  price: number | string;
  has_custom_price: boolean;
  sort_order: number;
};

type PumpRow = {
  id: string;
  name: string;
  price: number | string;
  default_for_profile: string | null;
  sort_order: number;
};

type WashFunctionRow = {
  id: string;
  name: string;
  category: string;
  is_base: boolean;
  premium_only: boolean;
  button_price: number | string;
  kit_price: number | string;
  requires_dosator: boolean;
  sort_order: number;
};

type WaterTreatmentRow = {
  id: string;
  type: string;
  name: string;
  capacity: string | null;
  level: string | null;
  price: number | string;
  sort_order: number;
};

type ExtraEquipmentRow = {
  id: string;
  category: string;
  name: string;
  price: number | string;
  selection_type: string;
  sub_options: unknown;
  sort_order: number;
};

type RobotRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  included_components: unknown;
  sort_order: number;
};

type BurRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  sort_order: number;
};

type TruckWashRow = {
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

// ─── Service: getters return mockData-shaped data ───────────────────────────

export interface AvdKit {
  id: string;
  name: string;
  price: number;
  premiumOnly?: boolean;
}

export interface ArasModel {
  id: string;
  name: string;
  price?: number;
}

export interface TruckWashType {
  id: string;
  name: string;
  price: number;
  currency: 'RUB';
  features: string[];
}

const PREMIUM_ONLY_AVD_IDS = new Set<string>(['hawk_25_200']);

export async function getProfiles(): Promise<ProfileConfig[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('branch', 'mso')
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
  }));
}

export async function getBumModels(): Promise<BumModel[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bum_models')
    .select('*')
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
  }));
}

export async function getAccessories(): Promise<Accessory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('accessories')
    .select('*')
    .eq('branch', 'mso')
    .order('sort_order');

  if (error) throw error;

  return (data as AccessoryRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    price: num(r.price),
    selected: false,
    // Hose pair is mutually exclusive (preserved from mockData behavior)
    exclusiveGroup: r.id === 'hose_4m' || r.id === 'hose_5m' ? 'hose' : undefined,
  }));
}

export async function getPumps(): Promise<AvdKit[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pumps')
    .select('*')
    .eq('branch', 'mso')
    .order('sort_order');

  if (error) throw error;

  return (data as PumpRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    price: num(r.price),
    ...(PREMIUM_ONLY_AVD_IDS.has(r.id) ? { premiumOnly: true } : {}),
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
    .order('sort_order');

  if (error) throw error;

  const base: PostFunction[] = [];
  const extra: PostFunction[] = [];

  for (const r of data as WashFunctionRow[]) {
    const isBase = r.is_base || r.category === 'base';
    const fn: PostFunction = isBase
      ? {
          id: r.id,
          name: r.name,
          isBase: true,
          enabled: true,
          buttonPrice: num(r.button_price),
          kitPrice: num(r.kit_price),
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
      });
    } else if (r.type === 'aras') {
      aras.push({
        id: r.id,
        name: r.name,
        ...(r.id === 'none' ? {} : { price: num(r.price) }),
      });
    }
  }

  return { osmos, aras };
}

export interface ExtraEquipmentResult {
  vacuums: VacuumOption[];
  postExtras: PostExtra[];
  washExtras: WashExtra[];
}

const VACUUM_PREFIX = 'vacuum__';
const POST_EXTRA_PREFIX = 'post_extra__';
const WASH_EXTRA_PREFIX = 'wash_extra__';

const stripPrefix = (id: string, prefix: string): string =>
  id.startsWith(prefix) ? id.slice(prefix.length) : id;

export async function getExtraEquipment(): Promise<ExtraEquipmentResult> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('extra_equipment')
    .select('*')
    .eq('branch', 'mso')
    .order('sort_order');

  if (error) throw error;

  const vacuums: VacuumOption[] = [];
  const postExtras: PostExtra[] = [];
  const washExtras: WashExtra[] = [];

  for (const r of data as ExtraEquipmentRow[]) {
    if (r.category === 'vacuum') {
      vacuums.push({
        id: stripPrefix(r.id, VACUUM_PREFIX),
        name: r.name,
        price: num(r.price),
      });
    } else if (r.category === 'post_extra') {
      postExtras.push({
        id: stripPrefix(r.id, POST_EXTRA_PREFIX),
        name: r.name,
        selected: false,
        quantity: 0,
        price: num(r.price),
      });
    } else {
      // wash_extra | dispenser | fogger — all rendered together in Step9 wash extras list
      washExtras.push({
        id: stripPrefix(r.id, WASH_EXTRA_PREFIX),
        name: r.name,
        selected: false,
        quantity: 0,
        price: num(r.price),
      });
    }
  }

  // Vacuum list always exposes a "none" radio option (UI requirement)
  if (!vacuums.find((v) => v.id === 'none')) {
    vacuums.push({ id: 'none', name: 'Нет', price: 0 });
  }

  return { vacuums, postExtras, washExtras };
}

export async function getRobotModels(): Promise<RobotModel[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('robot_models')
    .select('*')
    .order('sort_order');

  if (error) throw error;

  return (data as RobotRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    price: num(r.price),
    includedComponents: arr<string>(r.included_components),
  }));
}

export async function getBurModels(): Promise<RobotBurModel[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bur_models')
    .select('*')
    .order('sort_order');

  if (error) throw error;

  return (data as BurRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    price: num(r.price),
  }));
}

export async function getTruckWashTypes(): Promise<TruckWashType[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('truck_wash_types')
    .select('*')
    .order('sort_order');

  if (error) throw error;

  return (data as TruckWashRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    price: num(r.price),
    currency: 'RUB',
    features: arr<string>(r.features),
  }));
}
