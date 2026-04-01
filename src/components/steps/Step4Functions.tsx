'use client';

import type { Step4Data, PostFunction, FunctionOption } from '@/types';

interface Props {
  data: Step4Data;
  bumModelId: string;
  profileId: string;
  onChange: (data: Step4Data) => void;
}

export function Step4Functions({ data, bumModelId, profileId, onChange }: Props) {
  const isPremium = profileId === 'premium';

  const updateFunc = (id: string, patch: Partial<PostFunction>) => {
    onChange({
      functions: data.functions.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  };

  const baseFunctions = data.functions.filter((f) => f.isBase);
  const extraFunctions = data.functions.filter((f) => !f.isBase && (!f.premiumOnly || isPremium));

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Шаг 4. Функции на посту</h2>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Базовые функции (входят в комплект)</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {baseFunctions.map((f) => (
            <label
              key={f.id}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                f.enabled ? 'border-accent bg-accent/10' : 'border-border bg-surface'
              }`}
            >
              <input
                type="checkbox"
                checked={f.enabled}
                onChange={() => updateFunc(f.id, { enabled: !f.enabled })}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                f.enabled ? 'border-accent bg-accent' : 'border-border'
              }`}>
                {f.enabled && <span className="text-white text-xs">✓</span>}
              </div>
              <span className="text-sm font-medium">{f.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Дополнительные функции</label>
        <div className="space-y-3">
          {extraFunctions.map((f) => {
            const isActive = f.option !== 'none';
            const currentPrice = f.option === 'button_only'
              ? f.buttonPrice
              : f.option === 'button_and_kit'
                ? f.buttonPrice + f.kitPrice
                : 0;

            return (
              <div
                key={f.id}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  isActive ? 'border-accent bg-accent/5' : 'border-border bg-surface'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{f.name}</span>
                  <span className="text-xs text-accent font-bold">
                    {f.kitPrice > 0 ? f.kitPrice.toLocaleString('ru-RU') + ' ₽' : '—'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {([
                    ['none', 'Не добавлять'],
                    ['button_only', 'Только кнопка (0 ₽)'],
                    ['button_and_kit', `Кнопка + комплект (${f.kitPrice > 0 ? f.kitPrice.toLocaleString('ru-RU') : '0'} ₽)`],
                  ] as [FunctionOption, string][]).map(([opt, label]) => (
                    <button
                      key={opt}
                      onClick={() => updateFunc(f.id, { option: opt, enabled: opt !== 'none' })}
                      className={`flex-1 text-xs py-2 px-2 rounded transition-colors ${
                        f.option === opt
                          ? 'bg-accent text-white'
                          : 'bg-border/50 text-muted hover:bg-border'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Active price summary */}
                {isActive && currentPrice > 0 && (
                  <div className="mt-2 text-xs text-accent text-right">
                    +{currentPrice.toLocaleString('ru-RU')} ₽
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
