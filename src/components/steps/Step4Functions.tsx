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

  // ─── Group brand variants into a single card ──────────────────────────────
  // Functions sharing a `brand_group` (e.g. "active_chem" with brand="seko"|"ulka")
  // are merged so a manager sees one row per chemistry slot with a brand
  // selector inside. The number of brands per group is open-ended — adding
  // a third or fourth brand in the admin just adds another button.
  interface BrandGroup {
    groupKey: string;
    displayName: string;
    members: PostFunction[];
  }

  const brandGroupsMap = new Map<string, PostFunction[]>();
  for (const f of extraFunctions) {
    if (!f.brandGroup) continue;
    const list = brandGroupsMap.get(f.brandGroup) ?? [];
    list.push(f);
    brandGroupsMap.set(f.brandGroup, list);
  }

  const brandGroups: BrandGroup[] = [];
  const groupedIds = new Set<string>();
  for (const [groupKey, members] of brandGroupsMap) {
    if (members.length < 2) continue;
    members.sort((a, b) => (a.brand ?? '').localeCompare(b.brand ?? ''));
    const displayName =
      members[0].name.replace(/\s*\([\p{L}\d]+\)\s*$/u, '').trim() || groupKey;
    brandGroups.push({ groupKey, displayName, members });
    members.forEach((m) => groupedIds.add(m.id));
  }
  const ungroupedExtras = extraFunctions.filter((f) => !groupedIds.has(f.id));

  // Mode is either 'none' / 'button_only' or a brand name that matches one
  // of the group members. We canonicalise "только кнопка" onto the first
  // member of the group so the slot counter still treats the group as one.
  const getGroupMode = (g: BrandGroup): string => {
    for (const m of g.members) {
      if (m.option === 'button_and_kit' && m.brand) return m.brand;
    }
    if (g.members.some((m) => m.option === 'button_only')) return 'button_only';
    return 'none';
  };
  const setGroupMode = (g: BrandGroup, mode: string) => {
    const off = { option: 'none' as const, enabled: false };
    if (mode === 'none') {
      updateFuncs(g.members.map((m) => ({ id: m.id, patch: off })));
    } else if (mode === 'button_only') {
      updateFuncs(
        g.members.map((m, i) =>
          i === 0
            ? { id: m.id, patch: { option: 'button_only' as const, enabled: true } }
            : { id: m.id, patch: off },
        ),
      );
    } else {
      updateFuncs(
        g.members.map((m) =>
          m.brand === mode
            ? { id: m.id, patch: { option: 'button_and_kit' as const, enabled: true } }
            : { id: m.id, patch: off },
        ),
      );
    }
  };
  const groupPriceLabel = (g: BrandGroup, mode: string): string => {
    if (mode === 'none') return '—';
    if (mode === 'button_only') return '0 ₽';
    const member = g.members.find((m) => m.brand === mode);
    return member ? `${member.kitPrice.toLocaleString('ru-RU')} ₽` : '—';
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
          {/* Merged brand-group cards */}
          {brandGroups.map((group) => {
            const mode = getGroupMode(group);
            const isActive = mode !== 'none';
            const disabled = !isActive && atLimit;
            const buttons: { mode: string; label: string }[] = [
              { mode: 'none', label: 'Не добавлять' },
              { mode: 'button_only', label: 'Только кнопка (0 ₽)' },
              ...group.members.map((m) => ({
                mode: m.brand ?? '',
                label: `${(m.brand ?? '').toUpperCase()} (${m.kitPrice.toLocaleString('ru-RU')} ₽)`,
              })),
            ];
            const cols = buttons.length <= 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-5';

            return (
              <div
                key={group.groupKey}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  isActive
                    ? 'border-accent bg-accent/10'
                    : disabled
                      ? 'border-border/50 bg-surface opacity-50'
                      : 'border-border bg-surface'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{group.displayName}</span>
                  <span className="text-xs text-accent font-bold">{groupPriceLabel(group, mode)}</span>
                </div>
                <div className={`grid grid-cols-2 ${cols} gap-2`}>
                  {buttons.map(({ mode: m, label }) => {
                    const btnDisabled = disabled && m !== 'none';
                    return (
                      <button
                        key={m}
                        disabled={btnDisabled}
                        onClick={() => !btnDisabled && setGroupMode(group, m)}
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
