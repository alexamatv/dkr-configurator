'use client';

import type { TruckStep3Data } from '@/types';
import { useData } from '@/context/DataContext';

interface Props {
  data: TruckStep3Data;
  selectedType: string;
  onChange: (data: TruckStep3Data) => void;
}

export function TruckStep3Options({ data, selectedType, onChange }: Props) {
  const { kompakOptions } = useData();
  const isKompak = selectedType === 'kompak';

  const toggleOption = (id: string) => {
    const selected = data.selectedOptions.includes(id)
      ? data.selectedOptions.filter((o) => o !== id)
      : [...data.selectedOptions, id];
    onChange({ ...data, selectedOptions: selected });
  };

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold">Шаг 4. Дополнительные опции</h2>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-muted mb-3">
          {isKompak ? 'Опции КОМПАК' : 'Дополнительное оборудование'}
        </label>
        {kompakOptions.map((opt) => {
          const selected = data.selectedOptions.includes(opt.id);
          return (
            <label
              key={opt.id}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selected ? 'border-accent bg-accent/10' : 'border-border bg-surface'
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleOption(opt.id)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                selected ? 'border-accent bg-accent' : 'border-border'
              }`}>
                {selected && <span className="text-white text-xs">✓</span>}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{opt.name}</div>
              </div>
              <div className="text-accent font-bold text-sm">
                {opt.price.toLocaleString('ru-RU')} ₽
              </div>
            </label>
          );
        })}
      </div>

      {!isKompak && (
        <div>
          <label className="block text-sm font-medium text-muted mb-3">Доп. стоимость (индивидуальные опции)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={1000}
              value={data.customOptionsPrice || ''}
              onChange={(e) => onChange({ ...data, customOptionsPrice: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-48 bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <span className="text-sm text-muted">₽</span>
          </div>
        </div>
      )}
    </div>
  );
}
