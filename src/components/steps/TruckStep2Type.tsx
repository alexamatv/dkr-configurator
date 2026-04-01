'use client';

import type { TruckStep2Data } from '@/types';
import { truckWashTypes } from '@/data/mockData';

interface Props {
  data: TruckStep2Data;
  onChange: (data: TruckStep2Data) => void;
}

export function TruckStep2Type({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Шаг 2. Тип грузовой мойки</h2>

      <div className="grid grid-cols-1 gap-4">
        {truckWashTypes.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange({ selectedType: t.id })}
            className={`radio-card text-left ${data.selectedType === t.id ? 'selected' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-lg">{t.name}</div>
              <div className="text-accent font-bold">
                {t.price.toLocaleString('ru-RU')} ₽
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-3">
              {t.features.map((f, i) => (
                <div key={i} className="text-xs text-muted flex items-start gap-1">
                  <span className="text-accent shrink-0">•</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
