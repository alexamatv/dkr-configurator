'use client';

import type { TruckStep5Data } from '@/types';
import { truckWaterSystems } from '@/data/mockData';

interface Props {
  data: TruckStep5Data;
  onChange: (data: TruckStep5Data) => void;
}

export function TruckStep5Water({ data, onChange }: Props) {
  const update = (patch: Partial<TruckStep5Data>) => onChange({ ...data, ...patch });
  const isCustom = data.selectedWater === 'custom';

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold">Шаг 5. Водоочистка</h2>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Система водоочистки</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {truckWaterSystems.map((w) => (
            <button
              key={w.id}
              onClick={() => update({ selectedWater: w.id, customWaterPrice: w.id === 'custom' ? data.customWaterPrice : 0 })}
              className={`radio-card text-center ${data.selectedWater === w.id ? 'selected' : ''}`}
            >
              <div className="font-bold">{w.name}</div>
              {w.price > 0 && (
                <div className="text-accent font-bold mt-1">{w.price.toLocaleString('ru-RU')} ₽</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {isCustom && (
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            Стоимость водоочистки (ручной ввод)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={1000}
              value={data.customWaterPrice || ''}
              onChange={(e) => update({ customWaterPrice: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-48 bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <span className="text-sm text-muted">₽</span>
          </div>
        </div>
      )}

      {data.selectedWater === '' && (
        <p className="text-sm text-danger">Выберите систему водоочистки</p>
      )}
    </div>
  );
}
