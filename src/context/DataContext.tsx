'use client';

/**
 * DataContext — loads catalog data from Supabase once on mount and exposes
 * it via `useData()`. If the load fails (network error, missing env, etc.)
 * the context silently falls back to the static `mockData` so the calculator
 * keeps working offline.
 *
 * Things NOT stored in the DB (payment systems, dosator options, sub-option
 * configs, truck-wash kompak options, manager list, etc.) stay as direct
 * imports from `@/data/mockData` in the components that need them.
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
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
} from '@/types';
import {
  profiles as mockProfiles,
  bumModels as mockBumModels,
  defaultAccessories as mockAccessories,
  avdKits as mockAvdKits,
  defaultBaseFunctions as mockBaseFunctions,
  defaultExtraFunctions as mockExtraFunctions,
  osmosOptions as mockOsmos,
  arasModels as mockAras,
  vacuumOptions as mockVacuums,
  defaultPostExtras as mockPostExtras,
  defaultWashExtras as mockWashExtras,
  robotModels as mockRobotModels,
  burModels as mockBurModels,
  truckWashTypes as mockTruckWashTypes,
  robotExtraEquipment as mockRobotExtras,
  kompakOptions as mockKompakOptions,
  truckManualPostEquipment as mockTruckManualPost,
  truckWaterSystems as mockTruckWaterSystems,
  vacuumTerminalOptions as mockPostVacuums,
} from '@/data/mockData';
import {
  getProfiles,
  getBumModels,
  getAccessories,
  getPumps,
  getWashFunctions,
  getWaterTreatment,
  getExtraEquipment,
  getRobotModels,
  getBurModels,
  getTruckWashTypes,
  getSettings,
  type AvdKit,
  type ArasModel,
  type TruckWashType,
  type SimpleEquipmentItem,
  type VacuumLikeSubOptionsConfig,
  type FoggerSubOptionsConfig,
  type RobotSubOptionsConfig,
} from '@/services/dataService';
import {
  vacuumSubOptionsConfig as mockVacuumSub,
  dispenserSubOptionsConfig as mockDispenserSub,
  foggerSubOptionsConfig as mockFoggerSub,
  robotSubOptionsConfig as mockRobotSub,
} from '@/data/mockData';

export interface DataContextValue {
  profiles: ProfileConfig[];
  bumModels: BumModel[];
  defaultAccessories: Accessory[];
  avdKits: AvdKit[];
  defaultBaseFunctions: PostFunction[];
  defaultExtraFunctions: PostFunction[];
  osmosOptions: OsmosOption[];
  arasModels: ArasModel[];
  vacuumOptions: VacuumOption[];
  defaultPostExtras: PostExtra[];
  defaultWashExtras: WashExtra[];
  robotModels: RobotModel[];
  burModels: RobotBurModel[];
  truckWashTypes: TruckWashType[];
  /** robotExtraEquipment in mockData — extras shown on Robot step 4. */
  robotExtras: SimpleEquipmentItem[];
  /** kompakOptions in mockData — checkboxes on Truck step 3. */
  kompakOptions: SimpleEquipmentItem[];
  /** truckManualPostEquipment in mockData — Truck step 4 manual-post equipment. */
  truckManualPost: SimpleEquipmentItem[];
  /** truckWaterSystems in mockData — Truck step 5 water-treatment radios. */
  truckWaterSystems: SimpleEquipmentItem[];
  /** Terminal-mounted vacuums for МСО Шаг 8 (one per post). */
  postVacuums: SimpleEquipmentItem[];
  /** Sub-option pill config shared by every vacuum row. Mock fallback when null. */
  vacuumSubOptionsConfig: VacuumLikeSubOptionsConfig;
  /** Sub-option pill config shared by every dispenser row. Mock fallback when null. */
  dispenserSubOptionsConfig: VacuumLikeSubOptionsConfig;
  /** Sub-option pill config shared by every fogger row. Mock fallback when null. */
  foggerSubOptionsConfig: FoggerSubOptionsConfig;
  /** Robot wash payment / extra options pill config (Шаг 4 Робота). */
  robotSubOptionsConfig: RobotSubOptionsConfig;
  /** Editable montage rates / EUR rate / etc. read from app_settings. */
  settings: Map<string, number>;
  /** Reads a numeric setting with a typed fallback. */
  getSetting: (key: string, fallback: number) => number;
  // Helpers that close over the loaded bumModels + profiles
  calcBumPrice: (bumId: string, profileId: string) => number;
  getDefaultBumForProfile: (profileId: string) => string;
  getDefaultBumName: (profileId: string) => string;
  // Status
  isLoading: boolean;
  error: Error | null;
  source: 'supabase' | 'mock';
}

const DataContext = createContext<DataContextValue | null>(null);

function safeHost(rawUrl: string): string {
  try {
    return new URL(rawUrl).host;
  } catch {
    return 'invalid-url';
  }
}

const FALLBACK: Omit<DataContextValue, 'isLoading' | 'error' | 'source' | 'calcBumPrice' | 'getDefaultBumForProfile' | 'getDefaultBumName' | 'getSetting'> = {
  profiles: mockProfiles,
  bumModels: mockBumModels,
  defaultAccessories: mockAccessories,
  avdKits: mockAvdKits as AvdKit[],
  defaultBaseFunctions: mockBaseFunctions,
  defaultExtraFunctions: mockExtraFunctions,
  osmosOptions: mockOsmos,
  arasModels: mockAras as ArasModel[],
  // Filled below after the mock arrays — see fallback assignments
  robotExtras: mockRobotExtras as SimpleEquipmentItem[],
  kompakOptions: mockKompakOptions as SimpleEquipmentItem[],
  truckManualPost: mockTruckManualPost as SimpleEquipmentItem[],
  truckWaterSystems: mockTruckWaterSystems as SimpleEquipmentItem[],
  postVacuums: mockPostVacuums as SimpleEquipmentItem[],
  vacuumSubOptionsConfig: {
    payment: mockVacuumSub.payment.map((o) => ({ id: o.id, name: o.name, price: o.price, defaultOn: o.defaultOn })),
    baseButtons: mockVacuumSub.baseButtons.map((o) => ({ id: o.id, name: o.name, price: o.price, defaultOn: o.defaultOn })),
    extraButtons: mockVacuumSub.extraButtons.map((o) => ({ id: o.id, name: o.name, price: o.price, defaultOn: o.defaultOn })),
  },
  dispenserSubOptionsConfig: {
    payment: mockDispenserSub.payment.map((o) => ({ id: o.id, name: o.name, price: o.price, defaultOn: o.defaultOn })),
    baseButtons: mockDispenserSub.baseButtons.map((o) => ({ id: o.id, name: o.name, price: o.price, defaultOn: o.defaultOn })),
    extraButtons: mockDispenserSub.extraButtons.map((o) => ({ id: o.id, name: o.name, price: o.price, defaultOn: o.defaultOn })),
  },
  foggerSubOptionsConfig: {
    payment: mockFoggerSub.payment.map((o) => ({ id: o.id, name: o.name, price: o.price, defaultOn: o.defaultOn })),
    baseScents: mockFoggerSub.baseScents.map((o) => ({ id: o.id, name: o.name, price: o.price, defaultOn: o.defaultOn, locked: true })),
    extraScents: mockFoggerSub.extraScents.map((o) => ({ id: o.id, name: o.name, price: o.price, defaultOn: o.defaultOn })),
  },
  robotSubOptionsConfig: {
    payment: mockRobotSub.payment.map((o) => ({ id: o.id, name: o.name, price: o.price, defaultOn: o.defaultOn })),
    baseOptions: mockRobotSub.baseOptions.map((o) => ({ id: o.id, name: o.name, price: o.price, defaultOn: o.defaultOn })),
    extraOptions: mockRobotSub.extraOptions.map((o) => ({ id: o.id, name: o.name, price: o.price, defaultOn: o.defaultOn })),
  },
  settings: new Map(),
  vacuumOptions: mockVacuums,
  defaultPostExtras: mockPostExtras,
  defaultWashExtras: mockWashExtras,
  robotModels: mockRobotModels,
  burModels: mockBurModels,
  truckWashTypes: mockTruckWashTypes as TruckWashType[],
};

function buildHelpers(profiles: ProfileConfig[], bumModels: BumModel[]) {
  const defaultBumByProfile: Record<string, string> = {};
  for (const p of profiles) {
    if (p.defaultTerminal) defaultBumByProfile[p.id] = p.defaultTerminal;
  }

  const getDefaultBumForProfile = (profileId: string): string =>
    defaultBumByProfile[profileId] || 'model_20';

  const getDefaultBumName = (profileId: string): string => {
    const id = getDefaultBumForProfile(profileId);
    return bumModels.find((b) => b.id === id)?.name ?? '—';
  };

  const calcBumPrice = (bumId: string, profileId: string): number => {
    const bum = bumModels.find((b) => b.id === bumId);
    if (!bum) return 0;
    const defaultId = getDefaultBumForProfile(profileId);
    if (bumId === defaultId) return 0;
    const defaultBum = bumModels.find((b) => b.id === defaultId);
    return bum.realPrice - (defaultBum?.realPrice ?? 0);
  };

  return { calcBumPrice, getDefaultBumForProfile, getDefaultBumName };
}

interface ProviderState {
  loaded: Omit<DataContextValue, 'isLoading' | 'error' | 'source' | 'calcBumPrice' | 'getDefaultBumForProfile' | 'getDefaultBumName' | 'getSetting'> | null;
  error: Error | null;
  source: 'supabase' | 'mock';
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProviderState>({ loaded: null, error: null, source: 'supabase' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profiles, bumModels, accessories, pumps, wash, water, extra, robots, burs, trucks, settings] =
          await Promise.all([
            getProfiles(),
            getBumModels(),
            getAccessories(),
            getPumps(),
            getWashFunctions(),
            getWaterTreatment(),
            getExtraEquipment(),
            getRobotModels(),
            getBurModels(),
            getTruckWashTypes(),
            getSettings(),
          ]);

        if (cancelled) return;

        setState({
          loaded: {
            profiles,
            bumModels,
            defaultAccessories: accessories,
            avdKits: pumps,
            defaultBaseFunctions: wash.base,
            defaultExtraFunctions: wash.extra,
            osmosOptions: water.osmos,
            arasModels: water.aras,
            vacuumOptions: extra.vacuums,
            defaultPostExtras: extra.postExtras,
            defaultWashExtras: extra.washExtras,
            robotModels: robots,
            burModels: burs,
            truckWashTypes: trucks,
            robotExtras: extra.robotExtras,
            kompakOptions: extra.kompakOptions,
            truckManualPost: extra.truckManualPost,
            truckWaterSystems: extra.truckWaterSystems,
            postVacuums: extra.postVacuums,
            vacuumSubOptionsConfig: extra.vacuumSubOptionsConfig ?? FALLBACK.vacuumSubOptionsConfig,
            dispenserSubOptionsConfig: extra.dispenserSubOptionsConfig ?? FALLBACK.dispenserSubOptionsConfig,
            foggerSubOptionsConfig: extra.foggerSubOptionsConfig ?? FALLBACK.foggerSubOptionsConfig,
            robotSubOptionsConfig: extra.robotSubOptionsConfig ?? FALLBACK.robotSubOptionsConfig,
            settings,
          },
          error: null,
          source: 'supabase',
        });
      } catch (err) {
        if (cancelled) return;
        const error = err instanceof Error ? err : new Error(String(err));
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        const usedKey = anonKey || publishableKey;
        const diagnostic = {
          message: error.message,
          envUrlHost: url ? safeHost(url) : null,
          envAnonKeySet: Boolean(anonKey),
          envPublishableKeySet: Boolean(publishableKey),
          keyPrefix: usedKey ? `${usedKey.slice(0, 12)}…` : null,
          // Supabase PostgrestError fields, if present
          status: (err as { status?: number })?.status,
          code: (err as { code?: string })?.code,
          details: (err as { details?: string })?.details,
          hint: (err as { hint?: string })?.hint,
        };
        // eslint-disable-next-line no-console
        console.error('[DataProvider] Supabase load failed, falling back to mockData. Diagnostic:', diagnostic);
        // eslint-disable-next-line no-console
        console.error('[DataProvider] Original error:', error);
        setState({ loaded: FALLBACK, error, source: 'mock' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<DataContextValue | null>(() => {
    if (!state.loaded) return null;
    const helpers = buildHelpers(state.loaded.profiles, state.loaded.bumModels);
    const settings = state.loaded.settings;
    const getSetting = (key: string, fallback: number): number => {
      const v = settings.get(key);
      return Number.isFinite(v as number) ? (v as number) : fallback;
    };
    return {
      ...state.loaded,
      ...helpers,
      getSetting,
      isLoading: false,
      error: state.error,
      source: state.source,
    };
  }, [state]);

  if (!value) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <div className="text-sm">Загрузка данных…</div>
        </div>
      </div>
    );
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData() must be used inside <DataProvider>');
  }
  return ctx;
}
