'use client';

import type { Step9Data } from '@/types';
import { vacuumOptions } from '@/data/mockData';

interface Props {
  data: Step9Data;
  onChange: (data: Step9Data) => void;
}

export function Step9WashExtras({ data, onChange }: Props) {
  const update = (patch: Partial<Step9Data>) => onChange({ ...data, ...patch });

  const toggleExtra = (id: string) => {
    update({
      extras: data.extras.map((e) =>
        e.id === id ? { ...e, selected: !e.selected, quantity: !e.selected ? 1 : 0 } : e
      ),
    });
  };

  const setExtraQty = (id: string, qty: number) => {
    update({
      extras: data.extras.map((e) => (e.id === id ? { ...e, quantity: Math.max(0, qty) } : e)),
    });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Шаг 9. Доп. оборудование на мойку</h2>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Уличные пылесосы</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {vacuumOptions.map((v) => (
            <button
              key={v.id}
              onClick={() => update({ vacuumOption: v.id, vacuumQuantity: v.id === 'none' ? 0 : Math.max(data.vacuumQuantity, 1) })}
              className={`radio-card ${data.vacuumOption === v.id ? 'selected' : ''}`}
            >
              <div className="font-medium">{v.name}</div>
              {v.price > 0 && (
                <div className="text-accent text-sm font-bold mt-1">{v.price.toLocaleString('ru-RU')} ₽</div>
              )}
            </button>
          ))}
        </div>
        {data.vacuumOption !== 'none' && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-muted">Количество:</span>
            <input
              type="number"
              min={1}
              value={data.vacuumQuantity}
              onChange={(e) => update({ vacuumQuantity: parseInt(e.target.value) || 1 })}
              className="w-20 bg-surface border border-border rounded px-3 py-1 text-sm"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Другое оборудование</label>
        <div className="space-y-2">
          {data.extras.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-colors ${
                item.selected ? 'border-accent bg-accent/5' : 'border-border bg-surface'
              }`}
            >
              <label className="flex items-center gap-3 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => toggleExtra(item.id)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                  item.selected ? 'border-accent bg-accent' : 'border-border'
                }`}>
                  {item.selected && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted">{item.price.toLocaleString('ru-RU')} ₽</div>
                </div>
              </label>
              {item.selected && (
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => setExtraQty(item.id, parseInt(e.target.value) || 1)}
                  className="w-16 text-center bg-surface border border-border rounded py-1 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Магистрали (м.п.)</label>
        <div className="grid grid-cols-3 gap-4">
          {([
            ['air', 'Воздушные'],
            ['water', 'Водные'],
            ['chemical', 'Химические'],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs text-muted mb-1">{label}</label>
              <input
                type="number"
                min={0}
                value={data.pipelines[key]}
                onChange={(e) =>
                  update({
                    pipelines: { ...data.pipelines, [key]: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
