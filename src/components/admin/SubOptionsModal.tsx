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
  onClose: () => void;
  onSave: (next: SubOptionsValue) => Promise<void>;
}

const GROUP_LABELS: Record<string, string> = {
  payment: 'Оплата',
  baseButtons: 'Базовые кнопки',
  extraButtons: 'Доп. кнопки',
  baseScents: 'Базовые запахи',
  extraScents: 'Доп. запахи',
};

export function SubOptionsModal({ title, initial, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<SubOptionsValue>(() =>
    structuredClone(initial),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmpty =
    Array.isArray(draft)
      ? draft.length === 0
      : Object.values(draft).every((g) => !g || g.length === 0);

  const updatePrice = (groupKey: string | null, idx: number, value: string) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return;
    setDraft((prev) => {
      if (Array.isArray(prev)) {
        const next = [...prev];
        next[idx] = { ...next[idx], price: num };
        return next;
      }
      const next = { ...prev };
      next[groupKey!] = next[groupKey!].map((o, i) =>
        i === idx ? { ...o, price: num } : o,
      );
      return next;
    });
  };

  const commit = async () => {
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
        className="bg-surface border border-border rounded-lg w-full max-w-[600px] max-h-[80vh] overflow-y-auto"
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
          {isEmpty && (
            <div className="text-sm text-muted">У этой позиции нет подопций.</div>
          )}

          {Array.isArray(draft)
            ? draft.map((opt, i) => (
                <SubOptionRow
                  key={opt.id ?? i}
                  opt={opt}
                  onChange={(v) => updatePrice(null, i, v)}
                />
              ))
            : Object.entries(draft).map(([groupKey, group]) => (
                <div key={groupKey}>
                  <div className="text-xs font-medium text-muted mb-2">
                    {GROUP_LABELS[groupKey] ?? groupKey}
                  </div>
                  <div className="space-y-2">
                    {(group ?? []).map((opt, i) => (
                      <SubOptionRow
                        key={opt.id ?? i}
                        opt={opt}
                        onChange={(v) => updatePrice(groupKey, i, v)}
                      />
                    ))}
                  </div>
                </div>
              ))}

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

function SubOptionRow({
  opt,
  onChange,
}: {
  opt: SubOption;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="flex-1 truncate">{opt.name}</span>
      {opt.locked && (
        <span className="text-[10px] text-muted italic">в комплекте</span>
      )}
      <input
        type="number"
        min={0}
        step={1}
        value={opt.price}
        onChange={(e) => onChange(e.target.value)}
        disabled={opt.locked}
        className="w-24 bg-background border border-border rounded px-2 py-1 text-sm tabular-nums focus:outline-none focus:border-accent disabled:opacity-50"
      />
      <span className="text-xs text-muted">₽</span>
    </div>
  );
}
