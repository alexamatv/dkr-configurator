'use client';

import { useState } from 'react';

interface SubOption {
  id: string;
  name: string;
  price: number;
  defaultOn?: boolean;
  locked?: boolean;
}

// sub_options is stored as either an empty array [] or an object with named groups
// (e.g. payment / baseButtons / extraButtons / baseScents / extraScents).
export type SubOptionsValue = SubOption[] | Record<string, SubOption[]>;

interface Props {
  title: string;
  initial: SubOptionsValue;
  /** Optional banner shown at the top of the modal (e.g. "shared across category"). */
  hint?: string;
  /**
   * If true, the user can pick which group (payment/baseButtons/extraButtons or
   * payment/baseScents/extraScents) a new option goes into. We infer the
   * available groups from the keys already present in `initial`.
   */
  onClose: () => void;
  onSave: (next: SubOptionsValue) => Promise<void>;
}

const GROUP_LABELS: Record<string, string> = {
  payment: 'Оплата',
  baseButtons: 'Базовые кнопки',
  extraButtons: 'Доп. кнопки',
  baseScents: 'Базовые запахи',
  extraScents: 'Доп. запахи',
  baseOptions: 'Базовые опции',
  extraOptions: 'Доп. опции',
};

const newId = () => `custom_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;

export function SubOptionsModal({ title, initial, hint, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<SubOptionsValue>(() =>
    structuredClone(initial),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmptyObj =
    !Array.isArray(draft) &&
    Object.values(draft).every((g) => !g || g.length === 0);

  const updateRow = (
    groupKey: string | null,
    idx: number,
    patch: Partial<SubOption>,
  ) => {
    setDraft((prev) => {
      if (Array.isArray(prev)) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...patch };
        return next;
      }
      const next = { ...prev };
      next[groupKey!] = (next[groupKey!] ?? []).map((o, i) =>
        i === idx ? { ...o, ...patch } : o,
      );
      return next;
    });
  };

  const removeRow = (groupKey: string | null, idx: number) => {
    setDraft((prev) => {
      if (Array.isArray(prev)) {
        return prev.filter((_, i) => i !== idx);
      }
      const next = { ...prev };
      next[groupKey!] = (next[groupKey!] ?? []).filter((_, i) => i !== idx);
      return next;
    });
  };

  const addRow = (groupKey: string | null) => {
    const fresh: SubOption = {
      id: newId(),
      name: '',
      price: 0,
      defaultOn: false,
    };
    setDraft((prev) => {
      if (Array.isArray(prev)) {
        return [...prev, fresh];
      }
      const next = { ...prev };
      next[groupKey!] = [...(next[groupKey!] ?? []), fresh];
      return next;
    });
  };

  const validate = (): string | null => {
    const allRows = Array.isArray(draft)
      ? draft
      : Object.values(draft).flat();
    for (const opt of allRows) {
      if (!opt.name.trim()) return 'У каждой опции должно быть название.';
    }
    // Detect duplicate ids — possible if someone hand-edits or the original
    // jsonb had collisions; keep the data clean before saving.
    const ids = allRows.map((r) => r.id);
    if (new Set(ids).size !== ids.length) {
      return 'Дублирующиеся id среди опций.';
    }
    return null;
  };

  const commit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-lg w-full max-w-[680px] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-hover text-muted"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {hint && (
            <div className="text-[11px] text-muted bg-background/40 border border-border/60 rounded px-3 py-2">
              {hint}
            </div>
          )}

          {Array.isArray(draft) ? (
            <FlatGroup
              rows={draft}
              onChangeRow={(i, patch) => updateRow(null, i, patch)}
              onRemoveRow={(i) => removeRow(null, i)}
              onAddRow={() => addRow(null)}
              isEmpty={draft.length === 0}
            />
          ) : (
            <>
              {isEmptyObj && (
                <div className="text-sm text-muted">
                  У этой позиции нет групп опций.
                </div>
              )}
              {Object.entries(draft).map(([groupKey, group]) => (
                <NamedGroup
                  key={groupKey}
                  groupKey={groupKey}
                  rows={group ?? []}
                  onChangeRow={(i, patch) => updateRow(groupKey, i, patch)}
                  onRemoveRow={(i) => removeRow(groupKey, i)}
                  onAddRow={() => addRow(groupKey)}
                />
              ))}
            </>
          )}

          {error && <div className="text-xs text-danger">{error}</div>}
        </div>

        <div className="sticky bottom-0 bg-surface px-5 py-3 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-1.5 text-sm border border-border rounded hover:bg-surface-hover disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={() => void commit()}
            disabled={saving}
            className="px-4 py-1.5 text-sm bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NamedGroup({
  groupKey,
  rows,
  onChangeRow,
  onRemoveRow,
  onAddRow,
}: {
  groupKey: string;
  rows: SubOption[];
  onChangeRow: (i: number, patch: Partial<SubOption>) => void;
  onRemoveRow: (i: number) => void;
  onAddRow: () => void;
}) {
  return (
    <div className="border border-border/60 rounded p-3">
      <div className="text-xs font-medium text-muted mb-2">
        {GROUP_LABELS[groupKey] ?? groupKey}
      </div>
      <div className="space-y-1.5">
        {rows.length === 0 && (
          <div className="text-[11px] text-muted italic px-1 py-1">
            Опций пока нет.
          </div>
        )}
        {rows.map((opt, i) => (
          <SubOptionRow
            key={opt.id ?? i}
            opt={opt}
            onChange={(patch) => onChangeRow(i, patch)}
            onRemove={() => onRemoveRow(i)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onAddRow}
        className="mt-3 text-[11px] px-3 py-1 border border-dashed border-border rounded hover:border-accent hover:text-accent transition-colors"
      >
        + Добавить опцию
      </button>
    </div>
  );
}

function FlatGroup({
  rows,
  onChangeRow,
  onRemoveRow,
  onAddRow,
  isEmpty,
}: {
  rows: SubOption[];
  onChangeRow: (i: number, patch: Partial<SubOption>) => void;
  onRemoveRow: (i: number) => void;
  onAddRow: () => void;
  isEmpty: boolean;
}) {
  return (
    <div className="border border-border/60 rounded p-3">
      <div className="text-xs font-medium text-muted mb-2">Опции</div>
      <div className="space-y-1.5">
        {isEmpty && (
          <div className="text-[11px] text-muted italic px-1 py-1">
            Опций пока нет.
          </div>
        )}
        {rows.map((opt, i) => (
          <SubOptionRow
            key={opt.id ?? i}
            opt={opt}
            onChange={(patch) => onChangeRow(i, patch)}
            onRemove={() => onRemoveRow(i)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onAddRow}
        className="mt-3 text-[11px] px-3 py-1 border border-dashed border-border rounded hover:border-accent hover:text-accent transition-colors"
      >
        + Добавить опцию
      </button>
    </div>
  );
}

function SubOptionRow({
  opt,
  onChange,
  onRemove,
}: {
  opt: SubOption;
  onChange: (patch: Partial<SubOption>) => void;
  onRemove: () => void;
}) {
  const handleDelete = () => {
    const label = opt.name?.trim() || 'эту опцию';
    if (window.confirm(`Удалить опцию «${label}»?`)) {
      onRemove();
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <input
        type="text"
        value={opt.name}
        placeholder="Название"
        onChange={(e) => onChange({ name: e.target.value })}
        className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-accent"
      />
      <input
        type="number"
        min={0}
        step={1}
        value={opt.price}
        onChange={(e) => {
          const num = Number(e.target.value);
          if (!Number.isFinite(num) || num < 0) return;
          onChange({ price: num });
        }}
        disabled={opt.locked}
        className="w-24 bg-background border border-border rounded px-2 py-1 text-sm tabular-nums focus:outline-none focus:border-accent disabled:opacity-50"
      />
      <span className="text-xs text-muted">₽</span>
      <label
        className="flex items-center gap-1 text-[11px] text-muted cursor-pointer select-none whitespace-nowrap"
        title="Включена по умолчанию в калькуляторе"
      >
        <input
          type="checkbox"
          checked={Boolean(opt.defaultOn)}
          onChange={(e) => onChange({ defaultOn: e.target.checked })}
          className="accent-accent"
        />
        по умолч.
      </label>
      <button
        type="button"
        onClick={handleDelete}
        disabled={opt.locked}
        title={opt.locked ? 'Заблокированную опцию удалить нельзя' : 'Удалить'}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-hover text-muted hover:text-danger disabled:opacity-30 disabled:hover:text-muted disabled:hover:bg-transparent"
      >
        🗑
      </button>
    </div>
  );
}
