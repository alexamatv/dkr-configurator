'use client';

import { useState } from 'react';
import type { RobotStep2Data } from '@/types';
import { useData } from '@/context/DataContext';

interface Props {
  data: RobotStep2Data;
  onChange: (data: RobotStep2Data) => void;
}

export function RobotStep2Model({ data, onChange }: Props) {
  const { robotModels } = useData();
  const [expandedId, setExpandedId] = useState<string | null>(data.robotModel || null);

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold">Шаг 2. Модель робота</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {robotModels.map((m) => {
          const isSelected = data.robotModel === m.id;
          const isExpanded = expandedId === m.id;
          return (
            <div key={m.id} className="flex flex-col">
              <button
                onClick={() => {
                  onChange({ robotModel: m.id });
                  setExpandedId(isExpanded && isSelected ? null : m.id);
                }}
                className={`radio-card ${isSelected ? 'selected' : ''}`}
              >
                <div className="font-bold text-lg">{m.name}</div>
                <div className="text-xs text-muted mt-1">{m.description}</div>
                <div className="text-accent font-bold mt-3">
                  {m.price.toLocaleString('ru-RU')} ₽
                </div>
              </button>
              {isSelected && isExpanded && (
                <div className="mt-2 p-3 bg-accent/5 border border-accent/20 rounded-lg text-xs space-y-1">
                  <div className="font-medium text-accent mb-1.5">Что входит в комплект:</div>
                  {m.includedComponents.map((c, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-muted">
                      <span className="text-success shrink-0">✓</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              )}
              {isSelected && !isExpanded && (
                <button
                  onClick={() => setExpandedId(m.id)}
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
  );
}
