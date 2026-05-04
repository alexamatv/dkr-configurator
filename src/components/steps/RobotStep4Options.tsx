'use client';

import { useEffect } from 'react';
import type { RobotStep4Data, VacuumSubOption } from '@/types';
import { useData } from '@/context/DataContext';
import { CustomExtrasSection } from './CustomExtrasSection';

interface Props {
  data: RobotStep4Data;
  robotModelId: string;
  onChange: (data: RobotStep4Data) => void;
}

interface OptionCfg {
  id: string;
  name: string;
  price: number;
  defaultOn: boolean;
}

// Направляющие для заезда входят в Premium и Cosmo
const guidesIncludedIn = ['premium_360', 'cosmo_360'];

function SubOptionPill({
  cfg,
  selected,
  onToggle,
}: {
  cfg: OptionCfg;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
        selected ? 'border-accent bg-accent/10' : 'border-border bg-surface'
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="sr-only"
      />
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
        selected ? 'border-accent bg-accent' : 'border-border'
      }`}>
        {selected && <span className="text-white text-[10px]">✓</span>}
      </div>
      <span>{cfg.name}</span>
      {cfg.price > 1 && (
        <span className="text-muted">— {cfg.price.toLocaleString('ru-RU')} ₽</span>
      )}
    </label>
  );
}

export function RobotStep4Options({ data, robotModelId, onChange }: Props) {
  const { robotExtras, robotSubOptionsConfig, customRobotExtras } = useData();
  const guidesIncluded = guidesIncludedIn.includes(robotModelId);
  const update = (patch: Partial<RobotStep4Data>) => onChange({ ...data, ...patch });

  // Mirror Step9's merge-on-config-change effect: if admin adds/removes a
  // sub-option in the DB, fold the changes into local state so the cost
  // panel + KP iterate the right ids and prices.
  useEffect(() => {
    const flat = [
      ...robotSubOptionsConfig.payment,
      ...robotSubOptionsConfig.baseOptions,
      ...robotSubOptionsConfig.extraOptions,
    ];
    const current = data.subOptions ?? [];
    const knownIds = new Set(current.map((o) => o.id));
    const additions = flat
      .filter((cfg) => !knownIds.has(cfg.id))
      .map((cfg) => ({ id: cfg.id, name: cfg.name, price: cfg.price, selected: cfg.defaultOn }));
    const refreshed = current.map((o) => {
      const cfg = flat.find((c) => c.id === o.id);
      if (cfg && cfg.price !== o.price) return { ...o, price: cfg.price };
      return o;
    });
    const changed =
      additions.length > 0 ||
      refreshed.some((o, i) => o !== current[i]);
    if (!changed) return;
    update({ subOptions: [...refreshed, ...additions] });
    // Only react to config identity changes; toggling pills doesn't add ids.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [robotSubOptionsConfig]);

  const isSel = (id: string, fallback: boolean): boolean => {
    const found = (data.subOptions ?? []).find((o) => o.id === id);
    return found ? found.selected : fallback;
  };

  const toggleSubOption = (id: string) => {
    const list = data.subOptions ?? [];
    const exists = list.some((o) => o.id === id);
    if (exists) {
      update({
        subOptions: list.map((o) =>
          o.id === id ? { ...o, selected: !o.selected } : o,
        ),
      });
      return;
    }
    // Defensive: shouldn't happen because of the merge effect, but if a pill
    // is rendered before the effect runs we still want to record the toggle.
    const flat = [
      ...robotSubOptionsConfig.payment,
      ...robotSubOptionsConfig.baseOptions,
      ...robotSubOptionsConfig.extraOptions,
    ];
    const cfg = flat.find((c) => c.id === id);
    if (!cfg) return;
    update({
      subOptions: [
        ...list,
        { id: cfg.id, name: cfg.name, price: cfg.price, selected: !cfg.defaultOn },
      ],
    });
  };

  const renderPillGroup = (
    label: string,
    hint: string | null,
    items: OptionCfg[],
  ) => {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint && <div className="text-[11px] text-muted mb-2">{hint}</div>}
        <div className={`flex flex-wrap gap-2 ${hint ? '' : 'mt-2'}`}>
          {items.map((cfg) => (
            <SubOptionPill
              key={cfg.id}
              cfg={cfg}
              selected={isSel(cfg.id, cfg.defaultOn)}
              onToggle={() => toggleSubOption(cfg.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  const hasAnySubOptions =
    robotSubOptionsConfig.payment.length +
      robotSubOptionsConfig.baseOptions.length +
      robotSubOptionsConfig.extraOptions.length >
    0;

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

      {hasAnySubOptions && (
        <div>
          <label className="block text-sm font-medium text-muted mb-3">Опции терминала</label>
          <div className="ml-4 pl-4 border-l-2 border-accent/30 space-y-4">
            {renderPillGroup(
              'Система оплаты',
              'Встроены по умолчанию. Снимите галочку, если не нужно.',
              robotSubOptionsConfig.payment,
            )}
            {renderPillGroup(
              'Базовые опции',
              null,
              robotSubOptionsConfig.baseOptions,
            )}
            {renderPillGroup(
              'Дополнительные опции',
              null,
              robotSubOptionsConfig.extraOptions,
            )}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Дополнительное оборудование</label>
        <div className="space-y-3">
          {robotExtras.map((item) => {
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

      <CustomExtrasSection
        title="Прочие опции"
        items={customRobotExtras}
        value={data.customSelections ?? {}}
        onChange={(next) => update({ customSelections: next })}
      />
    </div>
  );
}
