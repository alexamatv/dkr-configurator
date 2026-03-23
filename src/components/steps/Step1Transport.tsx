'use client';

import type { Step1Data } from '@/types';
import { managers } from '@/data/mockData';

interface Props {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
}

export function Step1Transport({ data, onChange }: Props) {
  const update = (patch: Partial<Step1Data>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Шаг 1. Тип транспорта и объекта</h2>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Тип транспортного средства</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([['passenger', 'Легковой'], ['truck', 'Грузовой']] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => update({ vehicleType: value })}
              className={`radio-card text-center ${data.vehicleType === value ? 'selected' : ''}`}
            >
              <div className="text-2xl mb-2">{value === 'passenger' ? '🚗' : '🚛'}</div>
              <div className="font-medium">{label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Тип объекта</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([['self_service', 'Мойка самообслуживания'], ['robotic', 'Роботизированная мойка']] as const).map(
            ([value, label]) => (
              <button
                key={value}
                onClick={() => update({ objectType: value })}
                className={`radio-card text-center ${data.objectType === value ? 'selected' : ''}`}
              >
                <div className="font-medium">{label}</div>
              </button>
            )
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-2">Клиент</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={data.clientSearch}
            onChange={(e) => update({ clientSearch: e.target.value })}
            placeholder="Поиск клиента..."
            className="flex-1 bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <button className="px-4 py-2 bg-accent text-white text-sm rounded hover:bg-accent-hover transition-colors">
            + Добавить
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-2">Менеджер</label>
        <select
          value={data.manager}
          onChange={(e) => update({ manager: e.target.value })}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
        >
          <option value="">Выберите менеджера</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
