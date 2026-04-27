'use client';

import type { Step1Data } from '@/types';
import { StepHint } from '../StepHint';

interface Props {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
}

export function Step1Transport({ data, onChange }: Props) {
  const update = (patch: Partial<Step1Data>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold">Шаг 1. Тип транспорта и объекта</h2>

      <StepHint>
        Выберите тип транспорта, для которого формируете КП. От этого зависит набор оборудования и доступные опции на следующих шагах.
      </StepHint>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Тип транспортного средства</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[820px]">
          {([['passenger', 'Легковой (коммерческий)'], ['truck', 'Грузовой']] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                if (value === 'truck') {
                  update({ vehicleType: 'truck', objectType: 'truck' });
                } else {
                  update({ vehicleType: 'passenger', objectType: 'self_service' });
                }
              }}
              className={`radio-card text-center ${data.vehicleType === value ? 'selected' : ''}`}
            >
              <div className="text-2xl mb-2">{value === 'passenger' ? '🚗' : '🚛'}</div>
              <div className="font-medium">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {data.vehicleType === 'passenger' && (
        <div>
          <label className="block text-sm font-medium text-muted mb-3">Тип объекта</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[820px]">
            {([
              ['self_service', 'Мойка самообслуживания'],
              ['robotic', 'Роботизированная мойка'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => update({ objectType: value })}
                className={`radio-card text-center ${data.objectType === value ? 'selected' : ''}`}
              >
                <div className="font-medium">{label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-[480px]">
        <label className="block text-sm font-medium text-muted mb-2">Клиент</label>
        <input
          type="text"
          value={data.clientSearch}
          onChange={(e) => update({ clientSearch: e.target.value })}
          placeholder="Введите имя клиента"
          className="w-full h-11 bg-surface border border-border rounded-lg px-3 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <div className="max-w-[480px]">
        <label className="block text-sm font-medium text-muted mb-2">Менеджер</label>
        <input
          type="text"
          value={data.manager}
          onChange={(e) => update({ manager: e.target.value })}
          placeholder="Введите имя менеджера"
          className="w-full h-11 bg-surface border border-border rounded-lg px-3 text-sm focus:outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}
