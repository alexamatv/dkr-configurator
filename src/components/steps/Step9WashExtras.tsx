'use client';

import type { Step9Data, VacuumSubOption, WashExtra } from '@/types';
import { StepHint } from '../StepHint';
import {
  vacuumOptions,
  vacuumSubOptionsConfig,
  dispenserSubOptionsConfig,
  foggerSubOptionsConfig,
} from '@/data/mockData';

interface Props {
  data: Step9Data;
  onChange: (data: Step9Data) => void;
  title?: string;
}

interface OptionCfg {
  id: string;
  name: string;
  price: number;
  defaultOn: boolean;
}

function SubOptionPill({
  cfg,
  selected,
  onToggle,
  locked = false,
  includedLabel,
}: {
  cfg: OptionCfg;
  selected: boolean;
  onToggle: () => void;
  locked?: boolean;
  includedLabel?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs transition-colors ${
        locked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
      } ${selected ? 'border-accent bg-accent/10' : 'border-border bg-surface'}`}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={locked}
        onChange={() => !locked && onToggle()}
        className="sr-only"
      />
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
        selected ? 'border-accent bg-accent' : 'border-border'
      }`}>
        {selected && <span className="text-white text-[10px]">✓</span>}
      </div>
      <span>{cfg.name}</span>
      {includedLabel ? (
        <span className="text-muted italic">(в комплекте)</span>
      ) : (
        <span className="text-muted">— {cfg.price} ₽</span>
      )}
    </label>
  );
}

const OUTDOOR_EXTRA_IDS = ['washer_fluid_dispenser', 'dry_fog_machine'];

export function Step9WashExtras({ data, onChange, title }: Props) {
  const update = (patch: Partial<Step9Data>) => onChange({ ...data, ...patch });

  const toggleExtra = (id: string) => {
    update({
      extras: data.extras.map((e) =>
        e.id === id ? { ...e, selected: !e.selected, quantity: !e.selected ? 1 : 0 } : e
      ),
    });
  };

  const setExtraQty = (id: string, qty: number) => {
    update({
      extras: data.extras.map((e) => (e.id === id ? { ...e, quantity: Math.max(0, qty) } : e)),
    });
  };

  const toggleIn = (listKey: 'vacuumSubOptions' | 'dispenserSubOptions' | 'foggerSubOptions', id: string) => {
    const list = (data[listKey] ?? []) as VacuumSubOption[];
    update({
      [listKey]: list.map((o) => (o.id === id ? { ...o, selected: !o.selected } : o)),
    } as Partial<Step9Data>);
  };

  const isSel = (list: VacuumSubOption[] | undefined, id: string, fallback: boolean) => {
    const found = list?.find((o) => o.id === id);
    return found ? found.selected : fallback;
  };

  const dispenser = data.extras.find((e) => e.id === 'washer_fluid_dispenser');
  const fogger = data.extras.find((e) => e.id === 'dry_fog_machine');

  // Renders a single extra checkbox row (used for dispenser and fogger inside outdoor section)
  const renderExtraRow = (item: WashExtra | undefined) => {
    if (!item) return null;
    return (
      <div
        className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-colors ${
          item.selected ? 'border-accent bg-accent/10' : 'border-border bg-surface'
        }`}
      >
        <label className="flex items-center gap-3 flex-1 cursor-pointer">
          <input
            type="checkbox"
            checked={item.selected}
            onChange={() => toggleExtra(item.id)}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
            item.selected ? 'border-accent bg-accent' : 'border-border'
          }`}>
            {item.selected && <span className="text-white text-xs">✓</span>}
          </div>
          <div>
            <div className="text-sm font-medium">{item.name}</div>
            <div className="text-xs text-muted">{item.price.toLocaleString('ru-RU')} ₽</div>
          </div>
        </label>
        {item.selected && (
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => setExtraQty(item.id, parseInt(e.target.value) || 1)}
            className="w-16 text-center bg-surface border border-border rounded py-1 text-sm"
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold">{title ?? 'Шаг 9. Доп. оборудование на мойку'}</h2>

      <StepHint>
        Дополнительное оборудование на всю мойку целиком (не на отдельный пост): пылесосы, магистрали, дополнительные модули. Можно выбрать из списка или добавить своё с ручным вводом цены.
      </StepHint>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Уличное оборудование</label>

        {/* Vacuum radio group */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {vacuumOptions.map((v) => (
            <button
              key={v.id}
              onClick={() => update({ vacuumOption: v.id, vacuumQuantity: v.id === 'none' ? 0 : Math.max(data.vacuumQuantity, 1) })}
              className={`radio-card ${data.vacuumOption === v.id ? 'selected' : ''}`}
            >
              <div className="font-medium">{v.name}</div>
              {v.price > 0 && (
                <div className="text-accent text-sm font-bold mt-1">{v.price.toLocaleString('ru-RU')} ₽</div>
              )}
            </button>
          ))}
        </div>
        {data.vacuumOption !== 'none' && (
          <>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted">Количество:</span>
              <input
                type="number"
                min={1}
                value={data.vacuumQuantity}
                onChange={(e) => update({ vacuumQuantity: parseInt(e.target.value) || 1 })}
                className="w-20 bg-surface border border-border rounded px-3 py-1 text-sm"
              />
            </div>

            <div className="mt-4 ml-4 pl-4 border-l-2 border-accent/30 space-y-4">
              <div>
                <div className="text-sm font-medium text-foreground">Система оплаты</div>
                <div className="text-[11px] text-muted mb-2">Встроены по умолчанию. Снимите галочку, если не нужно.</div>
                <div className="flex flex-wrap gap-2">
                  {vacuumSubOptionsConfig.payment.map((cfg) => (
                    <SubOptionPill
                      key={cfg.id}
                      cfg={cfg}
                      selected={isSel(data.vacuumSubOptions, cfg.id, cfg.defaultOn)}
                      onToggle={() => toggleIn('vacuumSubOptions', cfg.id)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground mb-2">Базовые кнопки</div>
                <div className="flex flex-wrap gap-2">
                  {vacuumSubOptionsConfig.baseButtons.map((cfg) => (
                    <SubOptionPill
                      key={cfg.id}
                      cfg={cfg}
                      selected={isSel(data.vacuumSubOptions, cfg.id, cfg.defaultOn)}
                      onToggle={() => toggleIn('vacuumSubOptions', cfg.id)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground mb-2">Дополнительные кнопки</div>
                <div className="flex flex-wrap gap-2">
                  {vacuumSubOptionsConfig.extraButtons.map((cfg) => (
                    <SubOptionPill
                      key={cfg.id}
                      cfg={cfg}
                      selected={isSel(data.vacuumSubOptions, cfg.id, cfg.defaultOn)}
                      onToggle={() => toggleIn('vacuumSubOptions', cfg.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Separator + dispenser & fogger as checkboxes */}
        <div className="mt-6 pt-4 border-t border-border/60 space-y-2">
          <div className="text-[11px] text-muted mb-1">Дополнительные модули (независимый выбор)</div>

          {renderExtraRow(dispenser)}
          {dispenser?.selected && (
            <div className="mt-2 ml-4 pl-4 border-l-2 border-accent/30 space-y-4">
              <div>
                <div className="text-sm font-medium text-foreground">Система оплаты</div>
                <div className="text-[11px] text-muted mb-2">Встроены по умолчанию. Снимите галочку, если не нужно.</div>
                <div className="flex flex-wrap gap-2">
                  {dispenserSubOptionsConfig.payment.map((cfg) => (
                    <SubOptionPill
                      key={cfg.id}
                      cfg={cfg}
                      selected={isSel(data.dispenserSubOptions, cfg.id, cfg.defaultOn)}
                      onToggle={() => toggleIn('dispenserSubOptions', cfg.id)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground mb-2">Базовые кнопки</div>
                <div className="flex flex-wrap gap-2">
                  {dispenserSubOptionsConfig.baseButtons.map((cfg) => (
                    <SubOptionPill
                      key={cfg.id}
                      cfg={cfg}
                      selected={isSel(data.dispenserSubOptions, cfg.id, cfg.defaultOn)}
                      onToggle={() => toggleIn('dispenserSubOptions', cfg.id)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground mb-2">Дополнительные кнопки</div>
                <div className="flex flex-wrap gap-2">
                  {dispenserSubOptionsConfig.extraButtons.map((cfg) => (
                    <SubOptionPill
                      key={cfg.id}
                      cfg={cfg}
                      selected={isSel(data.dispenserSubOptions, cfg.id, cfg.defaultOn)}
                      onToggle={() => toggleIn('dispenserSubOptions', cfg.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {renderExtraRow(fogger)}
          {fogger?.selected && (
            <div className="mt-2 ml-4 pl-4 border-l-2 border-accent/30 space-y-4">
              <div>
                <div className="text-sm font-medium text-foreground">Система оплаты</div>
                <div className="text-[11px] text-muted mb-2">Встроены по умолчанию. Снимите галочку, если не нужно.</div>
                <div className="flex flex-wrap gap-2">
                  {foggerSubOptionsConfig.payment.map((cfg) => (
                    <SubOptionPill
                      key={cfg.id}
                      cfg={cfg}
                      selected={isSel(data.foggerSubOptions, cfg.id, cfg.defaultOn)}
                      onToggle={() => toggleIn('foggerSubOptions', cfg.id)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground mb-2">Запахи (в базе)</div>
                <div className="flex flex-wrap gap-2">
                  {foggerSubOptionsConfig.baseScents.map((cfg) => (
                    <SubOptionPill
                      key={cfg.id}
                      cfg={cfg}
                      selected={true}
                      onToggle={() => {}}
                      locked
                      includedLabel
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground mb-2">Дополнительные запахи</div>
                <div className="flex flex-wrap gap-2">
                  {foggerSubOptionsConfig.extraScents.map((cfg) => (
                    <SubOptionPill
                      key={cfg.id}
                      cfg={cfg}
                      selected={isSel(data.foggerSubOptions, cfg.id, cfg.defaultOn)}
                      onToggle={() => toggleIn('foggerSubOptions', cfg.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Другое оборудование</label>
        <div className="space-y-2">
          {data.extras.filter((e) => !OUTDOOR_EXTRA_IDS.includes(e.id)).map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-colors ${
                item.selected ? 'border-accent bg-accent/10' : 'border-border bg-surface'
              }`}
            >
              <label className="flex items-center gap-3 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => toggleExtra(item.id)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                  item.selected ? 'border-accent bg-accent' : 'border-border'
                }`}>
                  {item.selected && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted">{item.price.toLocaleString('ru-RU')} ₽</div>
                </div>
              </label>
              {item.selected && (
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => setExtraQty(item.id, parseInt(e.target.value) || 1)}
                  className="w-16 text-center bg-surface border border-border rounded py-1 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Магистрали</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            ['pipelinesAirPrice', 'Воздушные, ₽'],
            ['pipelinesWaterPrice', 'Водные, ₽'],
            ['pipelinesChemPrice', 'Химические, ₽'],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs text-muted mb-1">{label}</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={data[key] || ''}
                onChange={(e) => update({ [key]: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
