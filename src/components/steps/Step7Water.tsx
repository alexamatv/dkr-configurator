'use client';

import type { Step7Data } from '@/types';
import { osmosOptions, arasModels } from '@/data/mockData';

interface Props {
  data: Step7Data;
  onChange: (data: Step7Data) => void;
}

export function Step7Water({ data, onChange }: Props) {
  const update = (patch: Partial<Step7Data>) => onChange({ ...data, ...patch });
  const notReady = data.osmosOption === '' || data.arasModel === '';

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Шаг 7. Водоподготовка</h2>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Система осмоса</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => update({ osmosOption: 'none' })}
            className={`radio-card text-center ${data.osmosOption === 'none' ? 'selected' : ''}`}
          >
            <div className="font-medium">Не нужно</div>
            <div className="text-xs text-muted mt-1">клиент докупит самостоятельно</div>
          </button>
          {osmosOptions.map((o) => (
            <button
              key={o.id}
              onClick={() => update({ osmosOption: o.id })}
              className={`radio-card ${data.osmosOption === o.id ? 'selected' : ''}`}
            >
              <div className="font-bold">{o.capacity} л/ч</div>
              <div className={`text-xs mt-1 px-2 py-0.5 rounded inline-block ${
                o.level === 'premium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-accent/20 text-accent'
              }`}>
                {o.level === 'premium' ? 'Премиум' : 'Стандарт'}
              </div>
              <div className="text-accent font-bold mt-2">{o.price.toLocaleString('ru-RU')} ₽</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-2">Модель ARAS</label>
        <select
          value={data.arasModel}
          onChange={(e) => update({ arasModel: e.target.value })}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
        >
          <option value="" disabled>— Выберите —</option>
          <option value="none">Не нужно</option>
          {arasModels
            .filter((a) => a.id !== 'none')
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}{'price' in a ? ` — ${(a as { price: number }).price.toLocaleString('ru-RU')} ₽` : ''}
              </option>
            ))}
        </select>
      </div>

      {notReady && (
        <p className="text-sm text-danger">
          Выберите хотя бы одну опцию водоподготовки или отметьте что клиент докупит самостоятельно
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-muted mb-2">
          Стоимость водоподготовки (ручной ввод)
        </label>
        <p className="text-xs text-muted mb-2">
          Если нужно указать свою стоимость водоподготовки, введите сумму
        </p>
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
    </div>
  );
}
