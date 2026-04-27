'use client';

import type { Step4Data, PostFunction, FunctionOption } from '@/types';
import { StepHint } from '../StepHint';
import { useData } from '@/context/DataContext';

interface Props {
  data: Step4Data;
  bumModelId: string;
  profileId: string;
  onChange: (data: Step4Data) => void;
}

export function Step4Functions({ data, bumModelId, profileId, onChange }: Props) {
  void profileId;
  const { bumModels } = useData();

  const bum = bumModels.find((b) => b.id === bumModelId);
  const bumName = bum?.name ?? 'БУМ';
  const maxFunctions = bum?.maxFunctions ?? 12;

  const updateFunc = (id: string, patch: Partial<PostFunction>) => {
    onChange({
      functions: data.functions.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  };

  const updateFuncs = (patches: Array<{ id: string; patch: Partial<PostFunction> }>) => {
    onChange({
      functions: data.functions.map((f) => {
        const p = patches.find((x) => x.id === f.id);
        return p ? { ...f, ...p.patch } : f;
      }),
    });
  };

  const baseFunctions = data.functions.filter((f) => f.isBase);
  const extraFunctions = data.functions.filter((f) => !f.isBase);

  // ─── Group SEKO/ULKA pairs into a single card ─────────────────────────────
  // Functions ending in `_seko` and matching `_ulka` are merged so a manager
  // sees one row per chemistry/degreaser slot with a brand selector inside.
  interface BrandPair {
    stem: string;
    displayName: string;
    seko: PostFunction;
    ulka: PostFunction;
  }
  const brandPairs: BrandPair[] = [];
  const groupedIds = new Set<string>();
  for (const f of extraFunctions) {
    if (!f.id.endsWith('_seko')) continue;
    const stem = f.id.slice(0, -5);
    const ulka = extraFunctions.find((g) => g.id === `${stem}_ulka`);
    if (!ulka) continue;
    const displayName = f.name.replace(/\s*\(SEKO\)\s*$/i, '').trim();
    brandPairs.push({ stem, displayName, seko: f, ulka });
    groupedIds.add(f.id);
    groupedIds.add(ulka.id);
  }
  const ungroupedExtras = extraFunctions.filter((f) => !groupedIds.has(f.id));

  type BrandMode = 'none' | 'button_only' | 'seko' | 'ulka';
  const getBrandMode = (pair: BrandPair): BrandMode => {
    if (pair.seko.option === 'button_and_kit') return 'seko';
    if (pair.ulka.option === 'button_and_kit') return 'ulka';
    if (pair.seko.option === 'button_only' || pair.ulka.option === 'button_only') {
      return 'button_only';
    }
    return 'none';
  };
  const setBrandMode = (pair: BrandPair, mode: BrandMode) => {
    const off = { option: 'none' as const, enabled: false };
    if (mode === 'none') {
      updateFuncs([
        { id: pair.seko.id, patch: off },
        { id: pair.ulka.id, patch: off },
      ]);
    } else if (mode === 'button_only') {
      updateFuncs([
        { id: pair.seko.id, patch: { option: 'button_only', enabled: true } },
        { id: pair.ulka.id, patch: off },
      ]);
    } else if (mode === 'seko') {
      updateFuncs([
        { id: pair.seko.id, patch: { option: 'button_and_kit', enabled: true } },
        { id: pair.ulka.id, patch: off },
      ]);
    } else {
      updateFuncs([
        { id: pair.seko.id, patch: off },
        { id: pair.ulka.id, patch: { option: 'button_and_kit', enabled: true } },
      ]);
    }
  };
  const brandPriceLabel = (pair: BrandPair, mode: BrandMode): string => {
    if (mode === 'seko') return `${pair.seko.kitPrice.toLocaleString('ru-RU')} ₽`;
    if (mode === 'ulka') return `${pair.ulka.kitPrice.toLocaleString('ru-RU')} ₽`;
    if (mode === 'button_only') return '0 ₽';
    return '—';
  };

  // Count used slots: enabled base + extras with option !== 'none'
  const usedBase = baseFunctions.filter((f) => f.enabled).length;
  const usedExtras = extraFunctions.filter((f) => f.option && f.option !== 'none').length;
  const usedTotal = usedBase + usedExtras;
  const remaining = maxFunctions - usedTotal;
  const atLimit = remaining <= 0;
  const overLimit = remaining < 0;

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold">Шаг 4. Функции на посту</h2>

      <StepHint>
        Выберите функции мойки для этого поста. Базовые функции уже включены в профиль. Дополнительные (пена, воск, осмос и др.) добавляют стоимость. Каждая функция — это отдельный клапан/модуль на посту. Количество доступных функций зависит от выбранного терминала ({bumName}). Текущий лимит: {maxFunctions} функций.
      </StepHint>

      <div className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 ${
        overLimit
          ? 'border-red-500 bg-red-500/10'
          : atLimit
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-accent/30 bg-accent/5'
      }`}>
        <div className="text-sm">
          <span className="text-muted">Выбрано функций: </span>
          <span className={`font-bold ${overLimit ? 'text-red-500' : 'text-foreground'}`}>
            {usedTotal} / {maxFunctions}
          </span>
          <span className="text-xs text-muted ml-2">({bumName})</span>
        </div>
        {overLimit && (
          <span className="text-xs text-red-500 font-medium">
            Превышен лимит! Уберите {Math.abs(remaining)} функц.
          </span>
        )}
        {atLimit && !overLimit && (
          <span className="text-xs text-amber-500 font-medium">Все слоты заняты</span>
        )}
      </div>

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
        {atLimit && (
          <p className="text-xs text-muted mb-3">
            Все слоты заняты. Снимите функцию, чтобы добавить другую.
          </p>
        )}
        <div className="space-y-3">
          {/* Merged SEKO/ULKA cards */}
          {brandPairs.map((pair) => {
            const mode = getBrandMode(pair);
            const isActive = mode !== 'none';
            const disabled = !isActive && atLimit;
            const buttons: { mode: BrandMode; label: string }[] = [
              { mode: 'none', label: 'Не добавлять' },
              { mode: 'button_only', label: 'Только кнопка (0 ₽)' },
              { mode: 'seko', label: `SEKO (${pair.seko.kitPrice.toLocaleString('ru-RU')} ₽)` },
              { mode: 'ulka', label: `ULKA (${pair.ulka.kitPrice.toLocaleString('ru-RU')} ₽)` },
            ];

            return (
              <div
                key={pair.stem}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  isActive
                    ? 'border-accent bg-accent/10'
                    : disabled
                      ? 'border-border/50 bg-surface opacity-50'
                      : 'border-border bg-surface'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{pair.displayName}</span>
                  <span className="text-xs text-accent font-bold">{brandPriceLabel(pair, mode)}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {buttons.map(({ mode: m, label }) => {
                    const btnDisabled = disabled && m !== 'none';
                    return (
                      <button
                        key={m}
                        disabled={btnDisabled}
                        onClick={() => !btnDisabled && setBrandMode(pair, m)}
                        className={`text-xs py-2 px-2 rounded transition-colors ${
                          mode === m
                            ? 'bg-accent text-white'
                            : btnDisabled
                              ? 'bg-border/30 text-muted/50 cursor-not-allowed'
                              : 'bg-border/50 text-muted hover:bg-border'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Standalone extras */}
          {ungroupedExtras.map((f) => {
            const isActive = f.option !== 'none';
            const currentPrice = f.option === 'button_only'
              ? f.buttonPrice
              : f.option === 'button_and_kit'
                ? f.buttonPrice + f.kitPrice
                : 0;
            // Disable enabling new extras once at limit (but keep existing selections changeable)
            const disabled = !isActive && atLimit;

            return (
              <div
                key={f.id}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  isActive
                    ? 'border-accent bg-accent/10'
                    : disabled
                      ? 'border-border/50 bg-surface opacity-50'
                      : 'border-border bg-surface'
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
                  ] as [FunctionOption, string][]).map(([opt, label]) => {
                    const btnDisabled = disabled && opt !== 'none';
                    return (
                      <button
                        key={opt}
                        disabled={btnDisabled}
                        onClick={() => !btnDisabled && updateFunc(f.id, { option: opt, enabled: opt !== 'none' })}
                        className={`flex-1 text-xs py-2 px-2 rounded transition-colors ${
                          f.option === opt
                            ? 'bg-accent text-white'
                            : btnDisabled
                              ? 'bg-border/30 text-muted/50 cursor-not-allowed'
                              : 'bg-border/50 text-muted hover:bg-border'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
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
