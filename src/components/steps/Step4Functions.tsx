'use client';

import type { Step4Data, PostFunction, FunctionOption, VacuumType } from '@/types';
import { bumModels } from '@/data/mockData';

interface Props {
  data: Step4Data;
  bumModelId: string;
  onChange: (data: Step4Data) => void;
}

export function Step4Functions({ data, bumModelId, onChange }: Props) {
  const bum = bumModels.find((b) => b.id === bumModelId);
  const maxButtons = bum?.maxButtons ?? 8;

  const usedButtons = data.functions.filter((f) => {
    if (f.isBase) return f.enabled;
    return f.option === 'button_only' || f.option === 'button_and_kit';
  }).length;

  const atLimit = usedButtons >= maxButtons;

  const updateFunc = (id: string, patch: Partial<PostFunction>) => {
    onChange({
      functions: data.functions.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  };

  const baseFunctions = data.functions.filter((f) => f.isBase);
  const extraFunctions = data.functions.filter((f) => !f.isBase);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Шаг 4. Функции на посту</h2>

      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
        atLimit ? 'bg-danger/20 text-danger' : 'bg-accent/20 text-accent'
      }`}>
        Выбрано {usedButtons} из {maxButtons} кнопок
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Базовые функции</label>
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
                onChange={() => {
                  if (!f.enabled && atLimit) return;
                  updateFunc(f.id, { enabled: !f.enabled });
                }}
                className="sr-only"
                disabled={!f.enabled && atLimit}
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
            const canActivate = !atLimit || isActive;
            return (
              <div
                key={f.id}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  isActive ? 'border-accent bg-accent/5' : 'border-border bg-surface'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{f.name}</span>
                  {isActive && (
                    <span className="text-xs text-accent">
                      +{(f.option === 'button_only' ? f.buttonPrice : f.buttonPrice + f.kitPrice).toLocaleString('ru-RU')} ₽
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {([
                    ['none', 'Не добавлять'],
                    ['button_only', 'Только кнопка'],
                    ['button_and_kit', 'Кнопка + комплект'],
                  ] as [FunctionOption, string][]).map(([opt, label]) => {
                    const disabled = opt !== 'none' && !canActivate && f.option === 'none';
                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          if (disabled) return;
                          updateFunc(f.id, { option: opt, enabled: opt !== 'none' });
                        }}
                        disabled={disabled}
                        className={`flex-1 text-xs py-2 px-3 rounded transition-colors ${
                          f.option === opt
                            ? 'bg-accent text-white'
                            : disabled
                              ? 'bg-border/30 text-muted/50 cursor-not-allowed'
                              : 'bg-border/50 text-muted hover:bg-border'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {f.id === 'vacuum' && f.option === 'button_and_kit' && (
                  <div className="mt-3 flex gap-2">
                    {([['in_post', 'Внутрипостовой'], ['wall_mounted', 'Настенный']] as [VacuumType, string][]).map(
                      ([vt, label]) => (
                        <button
                          key={vt}
                          onClick={() => updateFunc(f.id, { vacuumType: vt })}
                          className={`text-xs py-1.5 px-3 rounded transition-colors ${
                            f.vacuumType === vt
                              ? 'bg-success/20 text-success'
                              : 'bg-border/50 text-muted hover:bg-border'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    )}
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
