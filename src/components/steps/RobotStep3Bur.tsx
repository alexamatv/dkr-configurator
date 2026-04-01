'use client';

import type { RobotStep3Data } from '@/types';
import { burModels } from '@/data/mockData';

interface Props {
  data: RobotStep3Data;
  onChange: (data: RobotStep3Data) => void;
}

export function RobotStep3Bur({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Шаг 3. Выбор БУР</h2>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Блок управления роботом</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {burModels.map((b) => {
            const isSelected = data.burModel === b.id;
            return (
              <button
                key={b.id}
                onClick={() => onChange({ burModel: b.id })}
                className={`radio-card ${isSelected ? 'selected' : ''}`}
              >
                <div className="font-bold text-lg">{b.name}</div>
                <div className="text-xs text-muted mt-1">{b.description}</div>
                <div className="text-accent font-bold mt-3">
                  {b.price.toLocaleString('ru-RU')} ₽
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
