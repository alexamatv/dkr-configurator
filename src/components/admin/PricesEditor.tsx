'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { EditablePrice } from './EditablePrice';
import { PhotoCell } from './PhotoCell';
import { SubOptionsModal, type SubOptionsValue } from './SubOptionsModal';

type Branch = 'mso' | 'robot' | 'truck';

interface BaseRow {
  id: string;
  name: string;
  branch?: string | null;
  is_active?: boolean;
  image_url?: string | null;
  show_image_in_kp?: boolean;
}

interface ProfileRow extends BaseRow { description: string | null; price: number; base_price: number }
interface BumRow extends BaseRow { real_price: number; max_functions: number }
interface AccessoryRow extends BaseRow { price: number }
interface PumpRow extends BaseRow { price: number }
interface WashFnRow extends BaseRow { category: string; button_price: number; kit_price: number; premium_only: boolean }
interface WaterRow extends BaseRow { type: string; price: number; capacity: string | null; level: string | null }
interface ExtraRow extends BaseRow { category: string; price: number; sub_options: SubOptionsValue }
interface RobotRow extends BaseRow { description: string | null; price: number }
interface BurRow extends BaseRow { description: string | null; price: number }
interface TruckRow extends BaseRow { price: number; description: string | null }

interface Catalog {
  profiles: ProfileRow[];
  bum_models: BumRow[];
  accessories: AccessoryRow[];
  pumps: PumpRow[];
  wash_functions: WashFnRow[];
  water_treatment: WaterRow[];
  extra_equipment: ExtraRow[];
  robot_models: RobotRow[];
  bur_models: BurRow[];
  truck_wash_types: TruckRow[];
}

const BRANCH_LABELS: Record<Branch, string> = {
  mso: 'МСО',
  robot: 'Робот',
  truck: 'Грузовик',
};

// Which sections show in each branch tab (sections without a branch column
// either always show or are gated by their natural scope).
const BRANCH_SECTIONS: Record<Branch, (keyof Catalog)[]> = {
  mso: ['profiles', 'bum_models', 'accessories', 'pumps', 'wash_functions', 'water_treatment', 'extra_equipment'],
  robot: ['robot_models', 'bur_models', 'water_treatment', 'extra_equipment'],
  truck: ['truck_wash_types', 'bur_models'],
};

const SECTION_TITLES: Record<keyof Catalog, string> = {
  profiles: 'Профили',
  bum_models: 'Терминалы (БУМы)',
  accessories: 'Аксессуары',
  pumps: 'Помпы (АВД)',
  wash_functions: 'Функции мойки',
  water_treatment: 'Водоподготовка',
  extra_equipment: 'Доп. оборудование',
  robot_models: 'Роботы',
  bur_models: 'БУР',
  truck_wash_types: 'Грузовые мойки',
};

export function PricesEditor() {
  const [branch, setBranch] = useState<Branch>('mso');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Catalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingSubOptions, setEditingSubOptions] = useState<{
    row: ExtraRow;
  } | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoadError(null);
    try {
      const [
        profiles,
        bumModels,
        accessories,
        pumps,
        washFunctions,
        waterTreatment,
        extraEquipment,
        robotModels,
        burModels,
        truckWashTypes,
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('sort_order'),
        supabase.from('bum_models').select('*').order('sort_order'),
        supabase.from('accessories').select('*').order('sort_order'),
        supabase.from('pumps').select('*').order('sort_order'),
        supabase.from('wash_functions').select('*').order('sort_order'),
        supabase.from('water_treatment').select('*').order('sort_order'),
        supabase.from('extra_equipment').select('*').order('sort_order'),
        supabase.from('robot_models').select('*').order('sort_order'),
        supabase.from('bur_models').select('*').order('sort_order'),
        supabase.from('truck_wash_types').select('*').order('sort_order'),
      ]);

      const first = [
        profiles, bumModels, accessories, pumps, washFunctions,
        waterTreatment, extraEquipment, robotModels, burModels, truckWashTypes,
      ].find((r) => r.error);
      if (first?.error) throw first.error;

      setData({
        profiles: profiles.data as ProfileRow[],
        bum_models: bumModels.data as BumRow[],
        accessories: accessories.data as AccessoryRow[],
        pumps: pumps.data as PumpRow[],
        wash_functions: washFunctions.data as WashFnRow[],
        water_treatment: waterTreatment.data as WaterRow[],
        extra_equipment: extraEquipment.data as ExtraRow[],
        robot_models: robotModels.data as RobotRow[],
        bur_models: burModels.data as BurRow[],
        truck_wash_types: truckWashTypes.data as TruckRow[],
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Ошибка загрузки');
    }
  }

  async function updateField(table: keyof Catalog, id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from(table).update(patch).eq('id', id);
    if (error) throw error;
    // Optimistically patch local state so the UI reflects the change without a refetch
    setData((prev) => {
      if (!prev) return prev;
      const rows = prev[table] as BaseRow[];
      const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
      return { ...prev, [table]: next } as Catalog;
    });
  }

  if (loadError) {
    return (
      <div className="max-w-[1200px] mx-auto p-6">
        <div className="text-sm text-danger">Ошибка загрузки: {loadError}</div>
        <button
          onClick={() => void loadAll()}
          className="mt-3 px-3 py-1.5 text-xs border border-border rounded hover:bg-surface-hover"
        >
          Повторить
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-[1200px] mx-auto p-6 flex items-center gap-3 text-sm text-muted">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        Загрузка данных…
      </div>
    );
  }

  const visibleSections = BRANCH_SECTIONS[branch];
  const matches = (s: string | null | undefined) =>
    !search.trim() || (s ?? '').toLowerCase().includes(search.trim().toLowerCase());

  // For sections with a `branch` column, restrict to current branch when applicable
  const filterByBranch = <R extends BaseRow>(rows: R[], hasBranchCol: boolean): R[] => {
    if (!hasBranchCol) return rows;
    return rows.filter((r) => (r.branch ?? null) === branch || r.branch == null);
  };

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          {(['mso', 'robot', 'truck'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBranch(b)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                branch === b
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {BRANCH_LABELS[b]}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию…"
          className="flex-1 sm:max-w-xs bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      {visibleSections.map((sectionKey) => (
        <section
          key={sectionKey}
          className="bg-surface border border-border rounded-lg overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-bold">{SECTION_TITLES[sectionKey]}</h2>
          </div>
          <div className="overflow-x-auto">
            {renderSection(sectionKey, data, branch, matches, filterByBranch, updateField, setEditingSubOptions)}
          </div>
        </section>
      ))}

      {editingSubOptions && (
        <SubOptionsModal
          title={editingSubOptions.row.name}
          initial={editingSubOptions.row.sub_options}
          onClose={() => setEditingSubOptions(null)}
          onSave={async (next) => {
            await updateField('extra_equipment', editingSubOptions.row.id, { sub_options: next });
          }}
        />
      )}
    </div>
  );
}

// ─── Per-section renderers ────────────────────────────────────────────────────

function renderSection(
  key: keyof Catalog,
  data: Catalog,
  branch: Branch,
  matches: (s: string | null | undefined) => boolean,
  filterByBranch: <R extends BaseRow>(rows: R[], hasBranch: boolean) => R[],
  update: (table: keyof Catalog, id: string, patch: Record<string, unknown>) => Promise<void>,
  openSubOpts: (s: { row: ExtraRow }) => void,
): React.ReactNode {
  const empty = (
    <div className="px-4 py-6 text-xs text-muted">Нет позиций.</div>
  );

  const photoTd = (table: keyof Catalog, row: BaseRow) => (
    <Td>
      <PhotoCell
        table={String(table)}
        id={row.id}
        name={row.name}
        imageUrl={row.image_url ?? null}
        showImageInKp={Boolean(row.show_image_in_kp)}
        onChange={(patch) => update(table, row.id, patch)}
      />
    </Td>
  );

  switch (key) {
    case 'profiles': {
      const rows = filterByBranch(data.profiles, true).filter((r) => matches(r.name));
      if (!rows.length) return empty;
      return (
        <Table headers={['Название', 'Описание', 'Цена', 'Фото']}>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <Td>{r.name}</Td>
              <Td muted>{r.description ?? '—'}</Td>
              <Td>
                <EditablePrice
                  value={Number(r.price)}
                  onSave={(v) => update('profiles', r.id, { price: v })}
                />
              </Td>
              {photoTd('profiles', r)}
            </tr>
          ))}
        </Table>
      );
    }

    case 'bum_models': {
      const rows = data.bum_models.filter((r) => matches(r.name));
      if (!rows.length) return empty;
      return (
        <Table headers={['Модель', 'Макс. функций', 'Цена', 'Фото']}>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <Td>{r.name}</Td>
              <Td muted>{r.max_functions}</Td>
              <Td>
                <EditablePrice
                  value={Number(r.real_price)}
                  onSave={(v) => update('bum_models', r.id, { real_price: v })}
                />
              </Td>
              {photoTd('bum_models', r)}
            </tr>
          ))}
        </Table>
      );
    }

    case 'accessories': {
      const rows = filterByBranch(data.accessories, true).filter((r) => matches(r.name));
      if (!rows.length) return empty;
      return (
        <Table headers={['Название', 'Цена', 'Фото']}>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <Td>{r.name}</Td>
              <Td>
                <EditablePrice
                  value={Number(r.price)}
                  onSave={(v) => update('accessories', r.id, { price: v })}
                />
              </Td>
              {photoTd('accessories', r)}
            </tr>
          ))}
        </Table>
      );
    }

    case 'pumps': {
      const rows = filterByBranch(data.pumps, true).filter((r) => matches(r.name));
      if (!rows.length) return empty;
      return (
        <Table headers={['Название', 'Цена', 'Фото']}>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <Td>{r.name}</Td>
              <Td>
                <EditablePrice
                  value={Number(r.price)}
                  onSave={(v) => update('pumps', r.id, { price: v })}
                />
              </Td>
              {photoTd('pumps', r)}
            </tr>
          ))}
        </Table>
      );
    }

    case 'wash_functions': {
      const rows = filterByBranch(data.wash_functions, true).filter((r) => matches(r.name));
      if (!rows.length) return empty;
      return (
        <Table headers={['Название', 'Категория', 'Кнопка', 'Комплект', 'Фото']}>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <Td>
                {r.name}
                {r.premium_only && (
                  <span className="ml-2 text-[10px] text-accent border border-accent/30 px-1.5 py-0.5 rounded">
                    premium
                  </span>
                )}
              </Td>
              <Td muted>{r.category}</Td>
              <Td>
                <EditablePrice
                  compact
                  value={Number(r.button_price)}
                  onSave={(v) => update('wash_functions', r.id, { button_price: v })}
                />
              </Td>
              <Td>
                <EditablePrice
                  compact
                  value={Number(r.kit_price)}
                  onSave={(v) => update('wash_functions', r.id, { kit_price: v })}
                />
              </Td>
              {photoTd('wash_functions', r)}
            </tr>
          ))}
        </Table>
      );
    }

    case 'water_treatment': {
      const rows = data.water_treatment.filter((r) => matches(r.name));
      if (!rows.length) return empty;
      return (
        <Table headers={['Тип', 'Название', 'Цена', 'Фото']}>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <Td muted>{r.type}</Td>
              <Td>{r.name}</Td>
              <Td>
                <EditablePrice
                  value={Number(r.price)}
                  onSave={(v) => update('water_treatment', r.id, { price: v })}
                />
              </Td>
              {photoTd('water_treatment', r)}
            </tr>
          ))}
        </Table>
      );
    }

    case 'extra_equipment': {
      const rows = filterByBranch(data.extra_equipment, true).filter((r) => matches(r.name));
      if (!rows.length) return empty;
      return (
        <Table headers={['Категория', 'Название', 'Цена', 'Под-опции', 'Фото']}>
          {rows.map((r) => {
            const subCount = countSubOptions(r.sub_options);
            return (
              <tr key={r.id} className="border-t border-border">
                <Td muted>{r.category}</Td>
                <Td>{r.name}</Td>
                <Td>
                  <EditablePrice
                    value={Number(r.price)}
                    onSave={(v) => update('extra_equipment', r.id, { price: v })}
                  />
                </Td>
                <Td>
                  {subCount > 0 ? (
                    <button
                      onClick={() => openSubOpts({ row: r })}
                      className="text-xs px-2 py-1 border border-border rounded hover:border-accent hover:text-accent"
                    >
                      Опции ({subCount})
                    </button>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </Td>
                {photoTd('extra_equipment', r)}
              </tr>
            );
          })}
        </Table>
      );
    }

    case 'robot_models': {
      const rows = data.robot_models.filter((r) => matches(r.name));
      if (!rows.length) return empty;
      return (
        <Table headers={['Название', 'Описание', 'Цена', 'Фото']}>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <Td>{r.name}</Td>
              <Td muted>{r.description ?? '—'}</Td>
              <Td>
                <EditablePrice
                  value={Number(r.price)}
                  onSave={(v) => update('robot_models', r.id, { price: v })}
                />
              </Td>
              {photoTd('robot_models', r)}
            </tr>
          ))}
        </Table>
      );
    }

    case 'bur_models': {
      const rows = data.bur_models.filter((r) => matches(r.name));
      if (!rows.length) return empty;
      return (
        <Table headers={['Название', 'Описание', 'Цена', 'Фото']}>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <Td>{r.name}</Td>
              <Td muted>{r.description ?? '—'}</Td>
              <Td>
                <EditablePrice
                  value={Number(r.price)}
                  onSave={(v) => update('bur_models', r.id, { price: v })}
                />
              </Td>
              {photoTd('bur_models', r)}
            </tr>
          ))}
        </Table>
      );
    }

    case 'truck_wash_types': {
      const rows = data.truck_wash_types.filter((r) => matches(r.name));
      if (!rows.length) return empty;
      return (
        <Table headers={['Название', 'Цена', 'Фото']}>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <Td>{r.name}</Td>
              <Td>
                <EditablePrice
                  value={Number(r.price)}
                  onSave={(v) => update('truck_wash_types', r.id, { price: v })}
                />
              </Td>
              {photoTd('truck_wash_types', r)}
            </tr>
          ))}
        </Table>
      );
    }
  }
}

function countSubOptions(value: SubOptionsValue): number {
  if (Array.isArray(value)) return value.length;
  return Object.values(value ?? {}).reduce(
    (sum, group) => sum + (Array.isArray(group) ? group.length : 0),
    0,
  );
}

function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-background/40">
          {headers.map((h) => (
            <th
              key={h}
              className="text-left text-xs font-medium text-muted px-4 py-2"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Td({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <td className={`px-4 py-2 align-middle ${muted ? 'text-muted text-xs' : ''}`}>
      {children}
    </td>
  );
}
