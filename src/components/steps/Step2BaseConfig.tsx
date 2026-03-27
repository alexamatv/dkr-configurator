'use client';

import { useState } from 'react';
import type { Step2Data } from '@/types';
import { profiles } from '@/data/mockData';

interface Props {
  data: Step2Data;
  onChange: (data: Step2Data) => void;
}

export function Step2BaseConfig({ data, onChange }: Props) {
  const [expandedProfile, setExpandedProfile] = useState<string | null>(data.profile);
  const selectedProfile = profiles.find((p) => p.id === data.profile);

  const toggleAccessory = (id: string) => {
    onChange({
      ...data,
      accessories: data.accessories.map((a) =>
        a.id === id ? { ...a, selected: !a.selected } : a
      ),
    });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Шаг 2. Базовая комплектация</h2>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Профиль</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  className={`radio-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="font-bold text-lg">{p.name}</div>
                  <div className="text-xs text-muted mt-1">{p.description}</div>
                  <div className="text-accent font-bold mt-3">
                    {p.price.toLocaleString('ru-RU')} ₽
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
            return (
              <label
                key={acc.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  acc.selected
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-surface hover:border-accent/50'
                }`}
              >
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
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{acc.name}</div>
                  <div className="text-xs text-muted">
                    {acc.price === 0 && inKit
                      ? 'Входит в комплект'
                      : acc.price === 0
                        ? '0 ₽'
                        : `+${acc.price.toLocaleString('ru-RU')} ₽ (доплата)`}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
