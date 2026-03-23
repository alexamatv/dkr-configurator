'use client';

import type { Step2Data, Accessory } from '@/types';
import { profiles } from '@/data/mockData';

interface Props {
  data: Step2Data;
  onChange: (data: Step2Data) => void;
}

export function Step2BaseConfig({ data, onChange }: Props) {
  const toggleAccessory = (id: string) => {
    onChange({
      ...data,
      accessories: data.accessories.map((a) =>
        a.id === id ? { ...a, selected: !a.selected } : a
      ),
    });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Шаг 2. Базовая комплектация</h2>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Профиль</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ ...data, profile: p.id as Step2Data['profile'] })}
              className={`radio-card ${data.profile === p.id ? 'selected' : ''}`}
            >
              <div className="font-bold text-lg">{p.name}</div>
              <div className="text-xs text-muted mt-1">{p.description}</div>
              <div className="text-accent font-bold mt-3">
                {p.price.toLocaleString('ru-RU')} ₽
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Аксессуары</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.accessories.map((acc) => (
            <label
              key={acc.id}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                acc.selected
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-surface hover:border-accent/50'
              }`}
            >
              <input
                type="checkbox"
                checked={acc.selected}
                onChange={() => toggleAccessory(acc.id)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                  acc.selected ? 'border-accent bg-accent' : 'border-border'
                }`}
              >
                {acc.selected && <span className="text-white text-xs">✓</span>}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{acc.name}</div>
                <div className="text-xs text-muted">{acc.price.toLocaleString('ru-RU')} ₽</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
