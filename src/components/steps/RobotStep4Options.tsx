'use client';

import type { RobotStep4Data } from '@/types';
import { robotExtraEquipment } from '@/data/mockData';

interface Props {
  data: RobotStep4Data;
  robotModelId: string;
  onChange: (data: RobotStep4Data) => void;
}

// Направляющие для заезда входят в Premium и Cosmo
const guidesIncludedIn = ['premium_360', 'cosmo_360'];

export function RobotStep4Options({ data, robotModelId, onChange }: Props) {
  const guidesIncluded = guidesIncludedIn.includes(robotModelId);

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold">Шаг 4. Дополнительные опции робота</h2>

      <div className="space-y-3">
        {/* Боковая сушка */}
        <div
          className={`p-4 rounded-lg border-2 transition-colors ${
            data.sideBlowerEnabled ? 'border-accent bg-accent/10' : 'border-border bg-surface'
          }`}
        >
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.sideBlowerEnabled}
              onChange={(e) => onChange({ ...data, sideBlowerEnabled: e.target.checked })}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
              data.sideBlowerEnabled ? 'border-accent bg-accent' : 'border-border'
            }`}>
              {data.sideBlowerEnabled && <span className="text-white text-xs">✓</span>}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Дополнительная боковая подвижная сушка</div>
              <div className="text-xs text-muted">2 двигателя 5.5 кВт, 36 м/с</div>
            </div>
          </label>
          {data.sideBlowerEnabled && (
            <div className="mt-3 ml-8 flex items-center gap-2">
              <span className="text-xs text-muted">Стоимость:</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={data.sideBlowerPrice || ''}
                onChange={(e) => onChange({ ...data, sideBlowerPrice: parseFloat(e.target.value) || 0 })}
                placeholder="Введите сумму, ₽"
                className="w-48 bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
              />
              <span className="text-xs text-muted">₽</span>
            </div>
          )}
        </div>

        {/* Направляющие для заезда */}
        <div
          className={`p-4 rounded-lg border-2 transition-colors ${
            data.guidesEnabled || guidesIncluded ? 'border-accent bg-accent/10' : 'border-border bg-surface'
          }`}
        >
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.guidesEnabled || guidesIncluded}
              disabled={guidesIncluded}
              onChange={(e) => onChange({ ...data, guidesEnabled: e.target.checked })}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
              data.guidesEnabled || guidesIncluded ? 'border-accent bg-accent' : 'border-border'
            }`}>
              {(data.guidesEnabled || guidesIncluded) && <span className="text-white text-xs">✓</span>}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Комплект направляющих для заезда</div>
              {guidesIncluded ? (
                <div className="text-xs text-success">Входит в комплект (0 ₽)</div>
              ) : (
                <div className="text-xs text-muted">Доп. опция</div>
              )}
            </div>
          </label>
          {data.guidesEnabled && !guidesIncluded && (
            <div className="mt-3 ml-8 flex items-center gap-2">
              <span className="text-xs text-muted">Стоимость:</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={data.guidesPrice || ''}
                onChange={(e) => onChange({ ...data, guidesPrice: parseFloat(e.target.value) || 0 })}
                placeholder="Введите сумму, ₽"
                className="w-48 bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
              />
              <span className="text-xs text-muted">₽</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Дополнительное оборудование</label>
        <div className="space-y-3">
          {robotExtraEquipment.map((item) => {
            const entry = data.extras?.find((e) => e.id === item.id);
            const selected = entry?.selected ?? false;
            const toggleExtra = () => {
              const newExtras = (data.extras ?? []).map((e) =>
                e.id === item.id ? { ...e, selected: !e.selected } : e,
              );
              onChange({ ...data, extras: newExtras });
            };
            return (
              <label
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selected ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/50'
                }`}
              >
                <input type="checkbox" checked={selected} onChange={toggleExtra} className="sr-only" />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                  selected ? 'border-accent bg-accent' : 'border-border'
                }`}>
                  {selected && <span className="text-white text-xs">✓</span>}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.name}</div>
                  {item.note && <div className="text-xs text-muted">{item.note}</div>}
                </div>
                <div className="text-accent font-bold text-sm shrink-0">
                  {item.price.toLocaleString('ru-RU')} ₽
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
