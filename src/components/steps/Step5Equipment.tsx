'use client';

import type { Step5Data, AvdSelection } from '@/types';
import { avdKits, profiles } from '@/data/mockData';

interface Props {
  data: Step5Data;
  profileId: string;
  onChange: (data: Step5Data) => void;
}

export function Step5Equipment({ data, profileId, onChange }: Props) {
  const profile = profiles.find((p) => p.id === profileId);
  const isPremium = profileId === 'premium';
  const filteredAvdKits = avdKits;

  const updateSelection = (id: string, avdId: string) => {
    onChange({
      ...data,
      avdSelections: data.avdSelections.map((s) =>
        s.id === id ? { ...s, avdId } : s
      ),
    });
  };

  const addPump = () => {
    onChange({
      ...data,
      avdSelections: [
        ...data.avdSelections,
        { id: String(Date.now()), avdId: '', isDefault: false },
      ],
    });
  };

  const removePump = (id: string) => {
    onChange({
      ...data,
      avdSelections: data.avdSelections.filter((s) => s.id !== id),
    });
  };

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold">Шаг 5. Выбор помпы</h2>

      {profile && (
        <div className="px-4 py-3 bg-accent/10 border border-accent/30 rounded-lg text-sm">
          Предзаполнено из профиля <span className="font-bold text-accent">{profile.name}</span>.
          Измените при необходимости.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Помпы (АВД)</label>
        <div className="space-y-2">
          {data.avdSelections.map((sel, idx) => {
            const selectedAvd = avdKits.find((k) => k.id === sel.avdId);
            const price = selectedAvd?.price ?? 0;
            return (
              <div key={sel.id} className="flex items-center gap-2">
                <select
                  value={sel.avdId}
                  onChange={(e) => updateSelection(sel.id, e.target.value)}
                  className="flex-1 bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  <option value="" disabled>— Выберите помпу —</option>
                  {filteredAvdKits.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
                <span className="shrink-0 text-sm text-muted w-28 text-right">
                  {sel.avdId
                    ? (sel.isDefault && price === 0
                        ? 'в комплекте'
                        : `${price.toLocaleString('ru-RU')} ₽`)
                    : ''}
                </span>
                {!sel.isDefault && (
                  <button
                    onClick={() => removePump(sel.id)}
                    className="shrink-0 w-8 h-8 text-danger hover:bg-danger/10 rounded flex items-center justify-center transition-colors"
                    title="Удалить"
                  >
                    ✕
                  </button>
                )}
                {sel.isDefault && <div className="w-8" />}
              </div>
            );
          })}
        </div>
        <button
          onClick={addPump}
          className="mt-3 text-sm text-accent hover:text-accent-hover transition-colors"
        >
          + Добавить помпу
        </button>
      </div>

      <div className="border-t border-border pt-6">
        <label className="block text-sm font-medium text-muted mb-1">Добавить помпу</label>
        <p className="text-xs text-muted mb-2">Введите стоимость дополнительной помпы</p>
        <input
          type="number"
          min={0}
          step={1000}
          value={data.customPumpPrice || ''}
          onChange={(e) =>
            onChange({ ...data, customPumpPrice: parseFloat(e.target.value) || 0 })
          }
          placeholder="Сумма, ₽"
          className="w-full sm:w-64 bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent placeholder:text-muted/50"
        />
      </div>
    </div>
  );
}
