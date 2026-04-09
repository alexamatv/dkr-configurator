'use client';

import type { TruckStep4Data } from '@/types';
import { truckManualPostEquipment, truckManualPostMontage } from '@/data/mockData';

interface Props {
  data: TruckStep4Data;
  onChange: (data: TruckStep4Data) => void;
}

export function TruckStep4ManualPost({ data, onChange }: Props) {
  const update = (patch: Partial<TruckStep4Data>) => onChange({ ...data, ...patch });

  const avdItem = truckManualPostEquipment.find((e) => e.id === 'avd')!;
  const hangerItem = truckManualPostEquipment.find((e) => e.id === 'cable_hanger')!;
  const totalEquip = (avdItem.price * data.avdCount) + (hangerItem.price * data.hangerCount);
  const totalMontage = data.manualPostEnabled ? truckManualPostMontage : 0;

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold">Шаг 4. Ручной пост</h2>

      <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
        data.manualPostEnabled ? 'border-accent bg-accent/10' : 'border-border bg-surface'
      }`}>
        <input
          type="checkbox"
          checked={data.manualPostEnabled}
          onChange={(e) => update({
            manualPostEnabled: e.target.checked,
            avdCount: e.target.checked ? Math.max(data.avdCount, 1) : 0,
            hangerCount: e.target.checked ? Math.max(data.hangerCount, 1) : 0,
          })}
          className="sr-only"
        />
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
          data.manualPostEnabled ? 'border-accent bg-accent' : 'border-border'
        }`}>
          {data.manualPostEnabled && <span className="text-white text-xs">✓</span>}
        </div>
        <div>
          <div className="font-medium">Добавить ручной пост</div>
          <div className="text-xs text-muted">Ручная мойка высоким давлением для грузовых ТС</div>
        </div>
      </label>

      {data.manualPostEnabled && (
        <div className="space-y-4 p-4 bg-surface rounded-lg border border-border">
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              {avdItem.name} — {avdItem.price.toLocaleString('ru-RU')} ₽/шт
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={data.avdCount}
              onChange={(e) => update({ avdCount: parseInt(e.target.value) || 0 })}
              className="w-24 bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              {hangerItem.name} — {hangerItem.price.toLocaleString('ru-RU')} ₽/шт
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={data.hangerCount}
              onChange={(e) => update({ hangerCount: parseInt(e.target.value) || 0 })}
              className="w-24 bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div className="border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted">
              <span>Оборудование</span>
              <span>{totalEquip.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className="flex justify-between text-muted mt-1">
              <span>Монтаж ручного поста</span>
              <span>{truckManualPostMontage.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className="flex justify-between font-bold mt-2">
              <span>Итого ручной пост</span>
              <span className="text-accent">{(totalEquip + totalMontage).toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
