'use client';

import type { Step8Data, AvdSelection } from '@/types';
import { avdKits } from '@/data/mockData';

interface Props {
  data: Step8Data;
  avdSelections: AvdSelection[];
  profileId: string;
  onChange: (data: Step8Data) => void;
}

const premiumIncludedExtras = ['freq_converter'];

export function Step8PostExtras({ data, avdSelections, profileId, onChange }: Props) {
  const isPremium = profileId === 'premium';
  // Основная помпа — первая default-строка из Step 5
  const defaultSel = avdSelections.find((s) => s.isDefault);
  const defaultAvd = defaultSel ? avdKits.find((k) => k.id === defaultSel.avdId) : null;

  const toggle = (id: string) => {
    onChange({
      ...data,
      extras: data.extras.map((e) =>
        e.id === id ? { ...e, selected: !e.selected, quantity: !e.selected ? 1 : 0 } : e
      ),
    });
  };

  const setQuantity = (id: string, qty: number) => {
    onChange({
      ...data,
      extras: data.extras.map((e) => (e.id === id ? { ...e, quantity: Math.max(0, qty) } : e)),
    });
  };

  const toggleSecondPump = () => {
    onChange({ ...data, secondPumpEnabled: !data.secondPumpEnabled });
  };

  // Цена второй помпы = цена профиля помпы (profile price, т.е. цена из каталога avdKits)
  // Для default помпы price=0 означает "входит в комплект", но вторая стоит полную цену.
  // Берём реальную цену из профиля: basePrice помпы. Для HAWK 15-20 = 85000 ₽.
  const secondPumpPrice = defaultAvd ? (defaultAvd.price > 0 ? defaultAvd.price : 85000) : 0;
  const secondPumpName = defaultAvd?.name?.replace(' (входит в комплект)', '') ?? 'Не выбрана';

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Шаг 8. Доп. оборудование к посту</h2>

      <div className="space-y-2">
        {/* Вторая помпа */}
        {defaultAvd && (
          <div
            className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-colors ${
              data.secondPumpEnabled ? 'border-accent bg-accent/5' : 'border-border bg-surface'
            }`}
          >
            <label className="flex items-center gap-3 flex-1 cursor-pointer">
              <input
                type="checkbox"
                checked={!!data.secondPumpEnabled}
                onChange={toggleSecondPump}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                data.secondPumpEnabled ? 'border-accent bg-accent' : 'border-border'
              }`}>
                {data.secondPumpEnabled && <span className="text-white text-xs">✓</span>}
              </div>
              <div>
                <div className="text-sm font-medium">Вторая помпа — {secondPumpName}</div>
                <div className="text-xs text-muted">{secondPumpPrice.toLocaleString('ru-RU')} ₽</div>
              </div>
            </label>
          </div>
        )}

        {data.extras.map((item) => {
          const isIncluded = isPremium && premiumIncludedExtras.includes(item.id);
          const displayPrice = isIncluded ? 0 : item.price;

          return (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-colors ${
                item.selected ? 'border-accent bg-accent/5' : 'border-border bg-surface'
              }`}
            >
              <label className="flex items-center gap-3 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => toggle(item.id)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                  item.selected ? 'border-accent bg-accent' : 'border-border'
                }`}>
                  {item.selected && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted">
                    {isIncluded
                      ? '0 ₽ (входит в комплект)'
                      : `${displayPrice.toLocaleString('ru-RU')} ₽ / шт.`}
                  </div>
                </div>
              </label>
              {item.selected && !isIncluded && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded bg-border/50 hover:bg-border flex items-center justify-center text-sm transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => setQuantity(item.id, parseInt(e.target.value) || 1)}
                    className="w-16 text-center bg-surface border border-border rounded py-1 text-sm"
                  />
                  <button
                    onClick={() => setQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded bg-border/50 hover:bg-border flex items-center justify-center text-sm transition-colors"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
