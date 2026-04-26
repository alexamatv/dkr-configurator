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
  type AvdKit,
  type ArasModel,
  type TruckWashType,
} from '@/services/dataService';

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

const FALLBACK: Omit<DataContextValue, 'isLoading' | 'error' | 'source' | 'calcBumPrice' | 'getDefaultBumForProfile' | 'getDefaultBumName'> = {
  profiles: mockProfiles,
  bumModels: mockBumModels,
  defaultAccessories: mockAccessories,
  avdKits: mockAvdKits as AvdKit[],
  defaultBaseFunctions: mockBaseFunctions,
  defaultExtraFunctions: mockExtraFunctions,
  osmosOptions: mockOsmos,
  arasModels: mockAras as ArasModel[],
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
  loaded: Omit<DataContextValue, 'isLoading' | 'error' | 'source' | 'calcBumPrice' | 'getDefaultBumForProfile' | 'getDefaultBumName'> | null;
  error: Error | null;
  source: 'supabase' | 'mock';
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProviderState>({ loaded: null, error: null, source: 'supabase' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profiles, bumModels, accessories, pumps, wash, water, extra, robots, burs, trucks] =
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
          },
          error: null,
          source: 'supabase',
        });
      } catch (err) {
        if (cancelled) return;
        const error = err instanceof Error ? err : new Error(String(err));
        // eslint-disable-next-line no-console
        console.warn('[DataProvider] Supabase load failed, falling back to mockData:', error.message);
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
    return {
      ...state.loaded,
      ...helpers,
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
