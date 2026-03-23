'use client';

import type { Step5Data, Dosator } from '@/types';
import { avdKits, dosatorTypes, profiles } from '@/data/mockData';

interface Props {
  data: Step5Data;
  profileId: string;
  onChange: (data: Step5Data) => void;
}

export function Step5Equipment({ data, profileId, onChange }: Props) {
  const profile = profiles.find((p) => p.id === profileId);

  const updateDosator = (id: string, patch: Partial<Dosator>) => {
    onChange({
      ...data,
      dosators: data.dosators.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    });
  };

  const addDosator = () => {
    onChange({
      ...data,
      dosators: [
        ...data.dosators,
        { id: String(Date.now()), type: 'SEKO', quantity: 1 },
      ],
    });
  };

  const removeDosator = (id: string) => {
    onChange({
      ...data,
      dosators: data.dosators.filter((d) => d.id !== id),
    });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Шаг 5. Основное оборудование</h2>

      {profile && (
        <div className="px-4 py-3 bg-accent/10 border border-accent/30 rounded-lg text-sm">
          Предзаполнено из профиля <span className="font-bold text-accent">{profile.name}</span>.
          Измените при необходимости.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-muted mb-2">Комплект АВД</label>
        <select
          value={data.avdKit}
          onChange={(e) => onChange({ ...data, avdKit: e.target.value })}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
        >
          {avdKits.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name} — {k.price.toLocaleString('ru-RU')} ₽
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted mb-3">Дозаторы</label>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_100px_40px] gap-2 text-xs text-muted px-1">
            <span>Тип</span>
            <span>Количество</span>
            <span></span>
          </div>
          {data.dosators.map((d) => (
            <div key={d.id} className="grid grid-cols-[1fr_100px_40px] gap-2">
              <select
                value={d.type}
                onChange={(e) => updateDosator(d.id, { type: e.target.value as Dosator['type'] })}
                className="bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
              >
                {dosatorTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={d.quantity}
                onChange={(e) => updateDosator(d.id, { quantity: parseInt(e.target.value) || 1 })}
                className="bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
              <button
                onClick={() => removeDosator(d.id)}
                className="text-danger hover:bg-danger/10 rounded flex items-center justify-center transition-colors"
                title="Удалить"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addDosator}
          className="mt-3 text-sm text-accent hover:text-accent-hover transition-colors"
        >
          + Добавить строку
        </button>
      </div>
    </div>
  );
}
