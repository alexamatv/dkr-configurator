'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createClient } from '@/lib/supabase/client';
import { EditablePrice } from './EditablePrice';
import { PhotoCell } from './PhotoCell';
import { SubOptionsModal, type SubOptionsValue } from './SubOptionsModal';
import { ItemModal, type FieldConfig } from './ItemModal';

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

const BRANCH_OPTS = [
  { label: 'МСО', value: 'mso' },
  { label: 'Робот', value: 'robot' },
  { label: 'Грузовик', value: 'truck' },
];

const FIELD_CONFIGS: Record<keyof Catalog, FieldConfig[]> = {
  profiles: [
    { name: 'branch', label: 'Ветка', type: 'select', required: true, options: BRANCH_OPTS, defaultValue: 'mso' },
    { name: 'name', label: 'Название', type: 'text', required: true },
    { name: 'description', label: 'Описание', type: 'textarea' },
    { name: 'price', label: 'Цена (бандл), ₽', type: 'number', required: true, helpText: 'Включает дефолтные аксессуары, помпу и оплату' },
    { name: 'base_price', label: 'Базовая цена (raw), ₽', type: 'number' },
    { name: 'included_components', label: 'Что входит в комплект', type: 'lines', helpText: 'По одному пункту на строку' },
  ],
  bum_models: [
    { name: 'name', label: 'Название', type: 'text', required: true },
    { name: 'description', label: 'Описание', type: 'text' },
    { name: 'real_price', label: 'Цена, ₽', type: 'number', required: true },
    { name: 'max_buttons', label: 'Макс. кнопок', type: 'number', defaultValue: 8 },
    { name: 'max_functions', label: 'Макс. функций', type: 'number', defaultValue: 12 },
  ],
  accessories: [
    { name: 'branch', label: 'Ветка', type: 'select', required: true, options: BRANCH_OPTS, defaultValue: 'mso' },
    { name: 'name', label: 'Название', type: 'text', required: true },
    { name: 'price', label: 'Цена, ₽', type: 'number', required: true },
    { name: 'has_custom_price', label: 'Цена редактируется на посту', type: 'checkbox' },
  ],
  pumps: [
    { name: 'branch', label: 'Ветка', type: 'select', required: true, options: BRANCH_OPTS, defaultValue: 'mso' },
    { name: 'name', label: 'Название', type: 'text', required: true },
    { name: 'price', label: 'Цена (доплата), ₽', type: 'number', required: true, helpText: '0, если входит в комплект профиля' },
  ],
  wash_functions: [
    { name: 'branch', label: 'Ветка', type: 'select', required: true, options: BRANCH_OPTS, defaultValue: 'mso' },
    { name: 'name', label: 'Название', type: 'text', required: true },
    { name: 'category', label: 'Категория', type: 'select', required: true, options: [
      { label: 'Базовая (входит в комплект)', value: 'base' },
      { label: 'Дополнительная', value: 'extra' },
    ], defaultValue: 'extra' },
    { name: 'is_base', label: 'Базовая (входит в профиль)', type: 'checkbox' },
    { name: 'button_price', label: 'Цена кнопки, ₽', type: 'number', defaultValue: 0 },
    { name: 'kit_price', label: 'Цена комплекта, ₽', type: 'number', defaultValue: 0 },
    { name: 'premium_only', label: 'Только для Премиум', type: 'checkbox' },
    { name: 'requires_dosator', label: 'Требует дозатора', type: 'checkbox' },
  ],
  water_treatment: [
    { name: 'type', label: 'Тип', type: 'select', required: true, options: [
      { label: 'Осмос', value: 'osmosis' },
      { label: 'АРОС', value: 'aras' },
    ] },
    { name: 'name', label: 'Название', type: 'text', required: true },
    { name: 'capacity', label: 'Производительность', type: 'text', placeholder: '500 л/ч' },
    { name: 'level', label: 'Уровень', type: 'select', options: [
      { label: 'Стандарт', value: 'standard' },
      { label: 'Премиум', value: 'premium' },
    ] },
    { name: 'price', label: 'Цена, ₽', type: 'number', required: true },
  ],
  extra_equipment: [
    { name: 'branch', label: 'Ветка', type: 'select', required: true, options: BRANCH_OPTS, defaultValue: 'mso' },
    { name: 'category', label: 'Категория', type: 'select', required: true, options: [
      { label: 'Пылесос', value: 'vacuum' },
      { label: 'Розлив омывайки', value: 'dispenser' },
      { label: 'Сухой туман', value: 'fogger' },
      { label: 'Доп. на мойку', value: 'wash_extra' },
      { label: 'Доп. к посту', value: 'post_extra' },
    ] },
    { name: 'name', label: 'Название', type: 'text', required: true },
    { name: 'price', label: 'Цена, ₽', type: 'number', required: true },
    { name: 'selection_type', label: 'Тип выбора', type: 'select', options: [
      { label: 'Чекбокс', value: 'checkbox' },
      { label: 'Радио (один из)', value: 'radio' },
    ], defaultValue: 'checkbox' },
  ],
  robot_models: [
    { name: 'name', label: 'Название', type: 'text', required: true },
    { name: 'description', label: 'Описание', type: 'textarea' },
    { name: 'price', label: 'Цена, ₽', type: 'number', required: true },
    { name: 'included_components', label: 'Что входит', type: 'lines', helpText: 'По одному пункту на строку' },
  ],
  bur_models: [
    { name: 'name', label: 'Название', type: 'text', required: true },
    { name: 'description', label: 'Описание', type: 'text' },
    { name: 'price', label: 'Цена, ₽', type: 'number', required: true },
  ],
  truck_wash_types: [
    { name: 'name', label: 'Название', type: 'text', required: true },
    { name: 'description', label: 'Описание', type: 'textarea' },
    { name: 'price', label: 'Цена, ₽', type: 'number', required: true },
    { name: 'features', label: 'Характеристики', type: 'lines', helpText: 'По одной строке на характеристику' },
  ],
};

export function PricesEditor() {
  const [branch, setBranch] = useState<Branch>('mso');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Catalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingSubOptions, setEditingSubOptions] = useState<{
    row: ExtraRow;
  } | null>(null);
  const [showHidden, setShowHidden] = useState<Partial<Record<keyof Catalog, boolean>>>({});
  const [addModal, setAddModal] = useState<{ table: keyof Catalog } | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Drag activates only after 6px of movement so single-clicks on the grip
  // don't get caught (the rest of the row isn't draggable anyway).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

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

  // Re-sequence sort_order across the given table to match the array of ids.
  // Uses a 10-step gap between rows so future single-row inserts don't need
  // to renumber the world.
  async function reorder(table: keyof Catalog, ids: string[]) {
    // Optimistic UI: reorder in local state first
    setData((prev) => {
      if (!prev) return prev;
      const rows = prev[table] as BaseRow[];
      const byId = new Map(rows.map((r) => [r.id, r]));
      const reordered = ids.map((id) => byId.get(id)).filter(Boolean) as BaseRow[];
      // Append any rows not in `ids` (filtered out by branch/visibility) at the end
      const tail = rows.filter((r) => !ids.includes(r.id));
      return { ...prev, [table]: [...reordered, ...tail] } as Catalog;
    });

    // Persist new sort_order values in parallel
    await Promise.all(
      ids.map((id, i) => supabase.from(table).update({ sort_order: i * 10 }).eq('id', id)),
    );
  }

  // Existing-name lookup for the duplicate-name validation in ItemModal
  const isNameTaken = (table: keyof Catalog, name: string, branchValue: string | null) => {
    if (!data) return false;
    const rows = data[table] as BaseRow[];
    const target = name.trim().toLowerCase();
    return rows.some((r) =>
      r.is_active !== false &&
      r.name.trim().toLowerCase() === target &&
      (branchValue == null || (r.branch ?? null) === branchValue || r.branch == null),
    );
  };

  // Returns human-readable references that point at this row as a default,
  // so we can warn before hiding it.
  const getDefaultUsage = (table: keyof Catalog, id: string): string[] => {
    if (!data) return [];
    const usage: string[] = [];
    if (table === 'bum_models') {
      for (const p of data.profiles) {
        const def = (p as ProfileRow & { default_bum?: string | null }).default_bum;
        if (def === id) usage.push(`профиль «${p.name}» (дефолтный БУМ)`);
      }
    } else if (table === 'pumps') {
      for (const p of data.profiles) {
        const def = (p as ProfileRow & { default_avd?: string | null }).default_avd;
        if (def === id) usage.push(`профиль «${p.name}» (дефолтная помпа)`);
      }
    } else if (table === 'accessories') {
      for (const p of data.profiles) {
        const acc = (p as ProfileRow & { default_accessories?: unknown }).default_accessories;
        const ids = Array.isArray(acc) ? (acc as string[]) : [];
        if (ids.includes(id)) usage.push(`профиль «${p.name}» (входит в комплект)`);
      }
    }
    return usage;
  };

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
          <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold">{SECTION_TITLES[sectionKey]}</h2>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHidden[sectionKey] ?? false}
                  onChange={(e) =>
                    setShowHidden((prev) => ({ ...prev, [sectionKey]: e.target.checked }))
                  }
                  className="w-3.5 h-3.5 accent-accent"
                />
                Показать скрытые
              </label>
              <button
                onClick={() => setAddModal({ table: sectionKey })}
                className="text-xs px-3 py-1.5 bg-accent text-white rounded hover:bg-accent-hover"
              >
                + Добавить позицию
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {renderSection(
              sectionKey,
              data,
              branch,
              matches,
              filterByBranch,
              updateField,
              setEditingSubOptions,
              showHidden[sectionKey] ?? false,
              reorder,
              getDefaultUsage,
              sensors,
            )}
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

      {addModal && (
        <ItemModal
          table={addModal.table}
          title={SECTION_TITLES[addModal.table]}
          fields={FIELD_CONFIGS[addModal.table]}
          isNameTaken={(name, formValues) =>
            isNameTaken(addModal.table, name, (formValues.branch as string) ?? null)
          }
          onClose={() => setAddModal(null)}
          onSaved={() => {
            void loadAll();
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
  showHidden: boolean,
  reorder: (table: keyof Catalog, ids: string[]) => Promise<void>,
  getDefaultUsage: (table: keyof Catalog, id: string) => string[],
  sensors: ReturnType<typeof useSensors>,
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

  const actionsTd = (table: keyof Catalog, row: BaseRow) => (
    <Td>
      {row.is_active === false ? (
        <button
          onClick={() => void update(table, row.id, { is_active: true })}
          className="text-[11px] px-2 py-1 border border-border rounded hover:border-accent hover:text-accent transition-colors"
          title="Восстановить позицию"
        >
          Восстановить
        </button>
      ) : (
        <button
          onClick={() => {
            const usage = getDefaultUsage(table, row.id);
            const base = `Скрыть позицию «${row.name}»? Она перестанет отображаться в калькуляторе.\n\nСкрытие можно отменить кнопкой «Показать скрытые».`;
            const msg = usage.length > 0
              ? `⚠️ Эта позиция используется как дефолтная:\n• ${usage.join('\n• ')}\n\nПри скрытии она перестанет подставляться по умолчанию.\n\n${base}`
              : base;
            if (confirm(msg)) {
              void update(table, row.id, { is_active: false });
            }
          }}
          className="text-[11px] px-2 py-1 border border-border rounded hover:border-danger hover:text-danger transition-colors"
          title="Скрыть позицию"
        >
          🚫 Скрыть
        </button>
      )}
    </Td>
  );

  // Wraps a section's <Table> in a DndContext + SortableContext so its rows
  // can be reordered. Drag is constrained to the rows of that section only —
  // the SortableContext lives next to a single table.
  const withDnd = (table: keyof Catalog, rows: BaseRow[], content: React.ReactNode) => {
    const ids = rows.map((r) => r.id);
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event: DragEndEvent) => {
          const { active, over } = event;
          if (!over || active.id === over.id) return;
          const oldIndex = ids.indexOf(String(active.id));
          const newIndex = ids.indexOf(String(over.id));
          if (oldIndex < 0 || newIndex < 0) return;
          const next = arrayMove(ids, oldIndex, newIndex);
          void reorder(table, next);
        }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {content}
        </SortableContext>
      </DndContext>
    );
  };

  // Apply soft-delete visibility filter
  const visibility = <R extends BaseRow>(rows: R[]): R[] =>
    showHidden ? rows : rows.filter((r) => r.is_active !== false);

  // Row className based on active state
  const trClass = (row: BaseRow) =>
    `border-t border-border ${row.is_active === false ? 'opacity-60 bg-background/30' : ''}`;

  // Name cell that shows a "Скрыто" badge for inactive rows
  const nameCell = (row: BaseRow, content: React.ReactNode = row.name) => (
    <Td>
      <span>{content}</span>
      {row.is_active === false && (
        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-border/60 text-muted uppercase tracking-wider">
          Скрыто
        </span>
      )}
    </Td>
  );

  switch (key) {
    case 'profiles': {
      const rows = visibility(filterByBranch(data.profiles, true).filter((r) => matches(r.name)));
      if (!rows.length) return empty;
      return withDnd('profiles', rows, (
        <Table headers={['', 'Название', 'Описание', 'Цена', 'Фото', 'Действия']}>
          {rows.map((r) => (
            <SortableRow key={r.id} id={r.id} className={trClass(r)}>
              {nameCell(r)}
              <Td muted>{r.description ?? '—'}</Td>
              <Td>
                <EditablePrice
                  value={Number(r.price)}
                  onSave={(v) => update('profiles', r.id, { price: v })}
                />
              </Td>
              {photoTd('profiles', r)}
              {actionsTd('profiles', r)}
            </SortableRow>
          ))}
        </Table>
      ));
    }

    case 'bum_models': {
      const rows = visibility(data.bum_models.filter((r) => matches(r.name)));
      if (!rows.length) return empty;
      return withDnd('bum_models', rows, (
        <Table headers={['', 'Модель', 'Макс. функций', 'Цена', 'Фото', 'Действия']}>
          {rows.map((r) => (
            <SortableRow key={r.id} id={r.id} className={trClass(r)}>
              {nameCell(r)}
              <Td muted>{r.max_functions}</Td>
              <Td>
                <EditablePrice
                  value={Number(r.real_price)}
                  onSave={(v) => update('bum_models', r.id, { real_price: v })}
                />
              </Td>
              {photoTd('bum_models', r)}
              {actionsTd('bum_models', r)}
            </SortableRow>
          ))}
        </Table>
      ));
    }

    case 'accessories': {
      const rows = visibility(filterByBranch(data.accessories, true).filter((r) => matches(r.name)));
      if (!rows.length) return empty;
      return withDnd('accessories', rows, (
        <Table headers={['', 'Название', 'Цена', 'Фото', 'Действия']}>
          {rows.map((r) => (
            <SortableRow key={r.id} id={r.id} className={trClass(r)}>
              {nameCell(r)}
              <Td>
                <EditablePrice
                  value={Number(r.price)}
                  onSave={(v) => update('accessories', r.id, { price: v })}
                />
              </Td>
              {photoTd('accessories', r)}
              {actionsTd('accessories', r)}
            </SortableRow>
          ))}
        </Table>
      ));
    }

    case 'pumps': {
      const rows = visibility(filterByBranch(data.pumps, true).filter((r) => matches(r.name)));
      if (!rows.length) return empty;
      return withDnd('pumps', rows, (
        <Table headers={['', 'Название', 'Цена', 'Фото', 'Действия']}>
          {rows.map((r) => (
            <SortableRow key={r.id} id={r.id} className={trClass(r)}>
              {nameCell(r)}
              <Td>
                <EditablePrice
                  value={Number(r.price)}
                  onSave={(v) => update('pumps', r.id, { price: v })}
                />
              </Td>
              {photoTd('pumps', r)}
              {actionsTd('pumps', r)}
            </SortableRow>
          ))}
        </Table>
      ));
    }

    case 'wash_functions': {
      const rows = visibility(filterByBranch(data.wash_functions, true).filter((r) => matches(r.name)));
      if (!rows.length) return empty;
      return withDnd('wash_functions', rows, (
        <Table headers={['', 'Название', 'Категория', 'Кнопка', 'Комплект', 'Фото', 'Действия']}>
          {rows.map((r) => (
            <SortableRow key={r.id} id={r.id} className={trClass(r)}>
              {nameCell(r, (
                <>
                  {r.name}
                  {r.premium_only && (
                    <span className="ml-2 text-[10px] text-accent border border-accent/30 px-1.5 py-0.5 rounded">
                      premium
                    </span>
                  )}
                </>
              ))}
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
              {actionsTd('wash_functions', r)}
            </SortableRow>
          ))}
        </Table>
      ));
    }

    case 'water_treatment': {
      const rows = visibility(data.water_treatment.filter((r) => matches(r.name)));
      if (!rows.length) return empty;
      return withDnd('water_treatment', rows, (
        <Table headers={['', 'Тип', 'Название', 'Цена', 'Фото', 'Действия']}>
          {rows.map((r) => (
            <SortableRow key={r.id} id={r.id} className={trClass(r)}>
              <Td muted>{r.type}</Td>
              {nameCell(r)}
              <Td>
                <EditablePrice
                  value={Number(r.price)}
                  onSave={(v) => update('water_treatment', r.id, { price: v })}
                />
              </Td>
              {photoTd('water_treatment', r)}
              {actionsTd('water_treatment', r)}
            </SortableRow>
          ))}
        </Table>
      ));
    }

    case 'extra_equipment': {
      const rows = visibility(filterByBranch(data.extra_equipment, true).filter((r) => matches(r.name)));
      if (!rows.length) return empty;
      return withDnd('extra_equipment', rows, (
        <Table headers={['', 'Категория', 'Название', 'Цена', 'Под-опции', 'Фото', 'Действия']}>
          {rows.map((r) => {
            const subCount = countSubOptions(r.sub_options);
            return (
              <SortableRow key={r.id} id={r.id} className={trClass(r)}>
                <Td muted>{r.category}</Td>
                {nameCell(r)}
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
                {actionsTd('extra_equipment', r)}
              </SortableRow>
            );
          })}
        </Table>
      ));
    }

    case 'robot_models': {
      const rows = visibility(data.robot_models.filter((r) => matches(r.name)));
      if (!rows.length) return empty;
      return withDnd('robot_models', rows, (
        <Table headers={['', 'Название', 'Описание', 'Цена', 'Фото', 'Действия']}>
          {rows.map((r) => (
            <SortableRow key={r.id} id={r.id} className={trClass(r)}>
              {nameCell(r)}
              <Td muted>{r.description ?? '—'}</Td>
              <Td>
                <EditablePrice
                  value={Number(r.price)}
                  onSave={(v) => update('robot_models', r.id, { price: v })}
                />
              </Td>
              {photoTd('robot_models', r)}
              {actionsTd('robot_models', r)}
            </SortableRow>
          ))}
        </Table>
      ));
    }

    case 'bur_models': {
      const rows = visibility(data.bur_models.filter((r) => matches(r.name)));
      if (!rows.length) return empty;
      return withDnd('bur_models', rows, (
        <Table headers={['', 'Название', 'Описание', 'Цена', 'Фото', 'Действия']}>
          {rows.map((r) => (
            <SortableRow key={r.id} id={r.id} className={trClass(r)}>
              {nameCell(r)}
              <Td muted>{r.description ?? '—'}</Td>
              <Td>
                <EditablePrice
                  value={Number(r.price)}
                  onSave={(v) => update('bur_models', r.id, { price: v })}
                />
              </Td>
              {photoTd('bur_models', r)}
              {actionsTd('bur_models', r)}
            </SortableRow>
          ))}
        </Table>
      ));
    }

    case 'truck_wash_types': {
      const rows = visibility(data.truck_wash_types.filter((r) => matches(r.name)));
      if (!rows.length) return empty;
      return withDnd('truck_wash_types', rows, (
        <Table headers={['', 'Название', 'Цена', 'Фото', 'Действия']}>
          {rows.map((r) => (
            <SortableRow key={r.id} id={r.id} className={trClass(r)}>
              {nameCell(r)}
              <Td>
                <EditablePrice
                  value={Number(r.price)}
                  onSave={(v) => update('truck_wash_types', r.id, { price: v })}
                />
              </Td>
              {photoTd('truck_wash_types', r)}
              {actionsTd('truck_wash_types', r)}
            </SortableRow>
          ))}
        </Table>
      ));
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

/**
 * <tr> wrapper that participates in dnd-kit's sortable context. Renders a
 * grip handle in the leftmost cell — only the grip is draggable, so click
 * targets inside other cells (edit, delete, etc.) keep working normally.
 */
function SortableRow({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    background: isDragging ? 'var(--color-accent)' : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style} className={className}>
      <td
        className="px-2 py-2 align-middle text-muted cursor-grab active:cursor-grabbing select-none w-6"
        {...attributes}
        {...listeners}
        title="Перетащите, чтобы изменить порядок"
      >
        ≡
      </td>
      {children}
    </tr>
  );
}
