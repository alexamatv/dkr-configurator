'use client';

import type { Step8Data, PostExtra } from '@/types';

interface Props {
  data: Step8Data;
  onChange: (data: Step8Data) => void;
}

export function Step8PostExtras({ data, onChange }: Props) {
  const toggle = (id: string) => {
    onChange({
      extras: data.extras.map((e) =>
        e.id === id ? { ...e, selected: !e.selected, quantity: !e.selected ? 1 : 0 } : e
      ),
    });
  };

  const setQuantity = (id: string, qty: number) => {
    onChange({
      extras: data.extras.map((e) => (e.id === id ? { ...e, quantity: Math.max(0, qty) } : e)),
    });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Шаг 8. Доп. оборудование к посту</h2>

      <div className="space-y-2">
        {data.extras.map((item) => (
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
                <div className="text-xs text-muted">{item.price.toLocaleString('ru-RU')} ₽ / шт.</div>
              </div>
            </label>
            {item.selected && (
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
        ))}
      </div>
    </div>
  );
}
