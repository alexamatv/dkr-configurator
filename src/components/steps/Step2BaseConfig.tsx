'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Step2Data } from '@/types';
import { StepHint } from '../StepHint';
import { useData } from '@/context/DataContext';

interface Props {
  data: Step2Data;
  onChange: (data: Step2Data) => void;
}

export function Step2BaseConfig({ data, onChange }: Props) {
  const { profiles } = useData();
  const [expandedProfile, setExpandedProfile] = useState<string | null>(data.profile);
  const selectedProfile = profiles.find((p) => p.id === data.profile);

  const toggleAccessory = (id: string) => {
    const acc = data.accessories.find((a) => a.id === id);
    if (!acc) return;

    // Exclusive group logic: selecting one deselects others in the same group
    if (acc.exclusiveGroup && !acc.selected) {
      onChange({
        ...data,
        accessories: data.accessories.map((a) => {
          if (a.id === id) return { ...a, selected: true };
          if (a.exclusiveGroup === acc.exclusiveGroup && a.id !== id) return { ...a, selected: false };
          return a;
        }),
      });
      return;
    }

    onChange({
      ...data,
      accessories: data.accessories.map((a) =>
        a.id === id ? { ...a, selected: !a.selected } : a
      ),
    });
  };

  const setCustomPrice = (id: string, value: number) => {
    onChange({
      ...data,
      accessories: data.accessories.map((a) =>
        a.id === id ? { ...a, customPrice: value } : a
      ),
    });
  };

  const isHose = (id: string) => id === 'hose_4m' || id === 'hose_5m';

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold">Шаг 2. Базовая комплектация</h2>

      <StepHint>
        Выберите профиль комплектации поста. «Старт» — базовый набор, «Стандарт» — расширенный с клапанами НД, «Премиум» — полная комплектация с сенсорным терминалом, эквайрингом и всеми аксессуарами в комплекте. Ниже можно добавить или убрать отдельные аксессуары.
      </StepHint>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Профиль</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-[900px] items-stretch">
          {profiles.map((p) => {
            const isSelected = data.profile === p.id;
            const isExpanded = expandedProfile === p.id;
            return (
              <div key={p.id} className="flex flex-col">
                <button
                  onClick={() => {
                    onChange({ ...data, profile: p.id as Step2Data['profile'] });
                    setExpandedProfile(isExpanded && isSelected ? null : p.id);
                  }}
                  className={`radio-card flex flex-col h-full !p-0 overflow-hidden ${isSelected ? 'selected' : ''}`}
                >
                  {p.imageUrl && (
                    <div className="relative w-full h-40 bg-background/40">
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 280px"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex flex-col flex-1 p-4">
                    <div className="font-bold text-lg">{p.name}</div>
                    <div className="text-xs text-muted mt-1 flex-1">{p.description}</div>
                    <div className="text-accent font-bold text-xl mt-3">
                      {p.price.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                </button>
                {isSelected && isExpanded && (
                  <div className="mt-2 p-3 bg-accent/5 border border-accent/20 rounded-lg text-xs space-y-1">
                    <div className="font-medium text-accent mb-1.5">Что входит в комплект:</div>
                    {p.includedComponents.map((c, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-muted">
                        <span className="text-success shrink-0">✓</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
                {isSelected && !isExpanded && (
                  <button
                    onClick={() => setExpandedProfile(p.id)}
                    className="mt-1 text-[11px] text-accent hover:underline text-left px-1"
                  >
                    Показать состав комплекта
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">
          Аксессуары
          {selectedProfile && (
            <span className="text-xs text-accent ml-2">
              (отмеченные входят в комплект «{selectedProfile.name}»)
            </span>
          )}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.accessories.map((acc) => {
            const inKit = selectedProfile?.defaultAccessories.includes(acc.id);
            const effectivePrice = acc.customPrice !== undefined ? acc.customPrice : acc.price;
            const showPriceInput = isHose(acc.id);

            return (
              <div
                key={acc.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                  acc.selected
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-surface hover:border-accent/50'
                }`}
              >
                <label className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                  <input
                    type="checkbox"
                    checked={acc.selected}
                    onChange={() => toggleAccessory(acc.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      acc.selected ? 'border-accent bg-accent' : 'border-border'
                    }`}
                  >
                    {acc.selected && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{acc.name}</div>
                    <div className="text-sm">
                      {inKit ? (
                        <span className="text-muted italic text-xs">в комплекте</span>
                      ) : (
                        <span className="font-bold text-accent">{effectivePrice.toLocaleString('ru-RU')} ₽</span>
                      )}
                    </div>
                  </div>
                </label>
                {showPriceInput && (
                  <div className="shrink-0 flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={acc.customPrice !== undefined ? acc.customPrice : acc.price}
                      onChange={(e) => setCustomPrice(acc.id, parseFloat(e.target.value) || 0)}
                      className="w-20 bg-background border border-border rounded px-1.5 py-1 text-xs text-right focus:outline-none focus:border-accent"
                    />
                    <span className="text-[10px] text-muted">₽</span>
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
