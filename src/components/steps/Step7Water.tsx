'use client';

import type { Step7Data } from '@/types';
import { osmosOptions, arasModels, boosterPumpPrice } from '@/data/mockData';

interface Props {
  data: Step7Data;
  onChange: (data: Step7Data) => void;
  title?: string;
}

export function Step7Water({ data, onChange, title }: Props) {
  const update = (patch: Partial<Step7Data>) => onChange({ ...data, ...patch });
  const notReady = (data.osmosOption === '' || data.arasModel === '') && !(data.customWaterPrice > 0);

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold">{title ?? 'Шаг 7. Водоподготовка'}</h2>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Система осмоса</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <button
            onClick={() => update({ osmosOption: 'none' })}
            className={`radio-card text-center !p-3 ${data.osmosOption === 'none' ? 'selected' : ''}`}
          >
            <div className="font-medium text-sm">Не нужно</div>
            <div className="text-xs text-muted mt-1">клиент докупит самостоятельно</div>
          </button>
          {osmosOptions.map((o) => (
            <button
              key={o.id}
              onClick={() => update({ osmosOption: o.id })}
              className={`radio-card text-center !p-3 ${data.osmosOption === o.id ? 'selected' : ''}`}
            >
              <div className="font-bold text-sm">{o.capacity} л/ч</div>
              <div className={`text-[10px] mt-1 px-1.5 py-0.5 rounded inline-block ${
                o.level === 'premium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-accent/20 text-accent'
              }`}>
                {o.level === 'premium' ? 'Премиум' : 'Стандарт'}
              </div>
              <div className="text-accent font-bold text-sm mt-2">{o.price.toLocaleString('ru-RU')} ₽</div>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-md">
        <label className="block text-sm font-medium text-muted mb-2">Модель ARAS</label>
        <select
          value={data.arasModel}
          onChange={(e) => update({ arasModel: e.target.value })}
          className="w-full h-11 bg-surface border border-border rounded-lg px-3 text-sm focus:outline-none focus:border-accent"
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

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Дополнительное оборудование</label>
        <div className="space-y-3">
          {/* Станция повышающая давление */}
          <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
            data.boosterPump ? 'border-accent bg-accent/10' : 'border-border bg-surface'
          }`}>
            <input type="checkbox" checked={data.boosterPump} onChange={(e) => update({ boosterPump: e.target.checked })} className="sr-only" />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
              data.boosterPump ? 'border-accent bg-accent' : 'border-border'
            }`}>
              {data.boosterPump && <span className="text-white text-xs">✓</span>}
            </div>
            <div>
              <div className="text-sm font-medium">Станция повышающая давление</div>
              <div className="text-xs text-accent font-bold">{boosterPumpPrice.toLocaleString('ru-RU')} ₽</div>
            </div>
          </label>

          {/* Умягчение на все функции */}
          <div className={`p-3 rounded-lg border-2 transition-colors ${
            data.softeningAll ? 'border-accent bg-accent/10' : 'border-border bg-surface'
          }`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={data.softeningAll} onChange={(e) => update({ softeningAll: e.target.checked, softeningAllPrice: e.target.checked ? Math.max(data.softeningAllPrice, 110000) : 0 })} className="sr-only" />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                data.softeningAll ? 'border-accent bg-accent' : 'border-border'
              }`}>
                {data.softeningAll && <span className="text-white text-xs">✓</span>}
              </div>
              <div>
                <div className="text-sm font-medium">Умягчение на все функции</div>
                <div className="text-xs text-muted">от 110 000 ₽ (зависит от кол-ва постов)</div>
              </div>
            </label>
            {data.softeningAll && (
              <div className="flex items-center gap-2 mt-2 ml-8">
                <input
                  type="number"
                  min={110000}
                  step={1000}
                  value={data.softeningAllPrice || ''}
                  onChange={(e) => update({ softeningAllPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="110000"
                  className="w-36 bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
                />
                <span className="text-xs text-muted">₽</span>
              </div>
            )}
          </div>

          {/* Умягчение для осмоса */}
          <div className={`p-3 rounded-lg border-2 transition-colors ${
            data.softeningOsmos ? 'border-accent bg-accent/10' : 'border-border bg-surface'
          }`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={data.softeningOsmos} onChange={(e) => update({ softeningOsmos: e.target.checked, softeningOsmosPrice: e.target.checked ? Math.max(data.softeningOsmosPrice, 110000) : 0 })} className="sr-only" />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                data.softeningOsmos ? 'border-accent bg-accent' : 'border-border'
              }`}>
                {data.softeningOsmos && <span className="text-white text-xs">✓</span>}
              </div>
              <div>
                <div className="text-sm font-medium">Умягчение для осмоса</div>
                <div className="text-xs text-muted">от 110 000 ₽ (зависит от кол-ва постов)</div>
              </div>
            </label>
            {data.softeningOsmos && (
              <div className="flex items-center gap-2 mt-2 ml-8">
                <input
                  type="number"
                  min={110000}
                  step={1000}
                  value={data.softeningOsmosPrice || ''}
                  onChange={(e) => update({ softeningOsmosPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="110000"
                  className="w-36 bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
                />
                <span className="text-xs text-muted">₽</span>
              </div>
            )}
          </div>
        </div>
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
