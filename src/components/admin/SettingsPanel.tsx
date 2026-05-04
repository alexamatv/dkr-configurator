'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Branch = 'mso' | 'robot' | 'truck';

interface SettingDef {
  key: string;
  label: string;
  unit?: string;
  /** Stored as decimal (0.10) but edited as percent (10). */
  isPct?: boolean;
  helpText?: string;
}

const SETTINGS_BY_BRANCH: Record<Branch, SettingDef[]> = {
  mso: [
    { key: 'montage_full_pct',          label: 'Полный монтаж',          unit: '%', isPct: true },
    { key: 'montage_commissioning_pct', label: 'Шеф-пусконаладка',       unit: '%', isPct: true },
    { key: 'default_discount',          label: 'Скидка по умолчанию',    unit: '%' },
    { key: 'default_vat',               label: 'НДС по умолчанию',       unit: '%' },
  ],
  robot: [
    { key: 'montage_robot_fixed', label: 'Монтаж робота (фикс)', unit: '₽' },
  ],
  truck: [
    { key: 'montage_kompak_fixed', label: 'Монтаж КОМПАК (фикс)', unit: '₽' },
    { key: 'eur_rub_rate',         label: 'Курс EUR / RUB',       unit: '₽',
      helpText: 'Используется при пересчёте прайса грузовых моек, если заданы в EUR' },
  ],
};

/**
 * Editable wrapper around the `app_settings` k-v table. Shows the keys
 * relevant to the active admin tab. Each input saves on blur/Enter via a
 * single UPDATE — values are stored as JSONB scalars (numbers).
 */
export function SettingsPanel({ branch }: { branch: Branch }) {
  const supabase = useMemo(() => createClient(), []);
  const [values, setValues] = useState<Record<string, number | null>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const defs = SETTINGS_BY_BRANCH[branch];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('app_settings').select('key, value');
      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        setLoaded(true);
        return;
      }
      const next: Record<string, number | null> = {};
      for (const r of (data ?? []) as { key: string; value: unknown }[]) {
        next[r.key] = typeof r.value === 'number' ? r.value : Number(r.value ?? NaN) || null;
      }
      setValues(next);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  const save = async (key: string, raw: number, isPct: boolean) => {
    const stored = isPct ? raw / 100 : raw;
    const { error } = await supabase.from('app_settings').update({ value: stored }).eq('key', key);
    if (error) throw error;
    setValues((prev) => ({ ...prev, [key]: stored }));
  };

  return (
    <section className="bg-surface border border-border rounded-lg p-5 space-y-4">
      <div>
        <h2 className="text-sm font-bold">Настройки</h2>
        <p className="text-xs text-muted mt-0.5">
          Глобальные параметры для ветки. Сохраняются автоматически на потерю фокуса или Enter.
        </p>
      </div>
      {loadError && <div className="text-xs text-danger">Ошибка загрузки: {loadError}</div>}
      {!loaded && !loadError && (
        <div className="text-xs text-muted">Загрузка…</div>
      )}
      {loaded && (
        <div className="space-y-3">
          {defs.map((d) => (
            <SettingRow
              key={d.key}
              def={d}
              stored={values[d.key] ?? null}
              onSave={(v) => save(d.key, v, !!d.isPct)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SettingRow({
  def,
  stored,
  onSave,
}: {
  def: SettingDef;
  stored: number | null;
  onSave: (raw: number) => Promise<void>;
}) {
  const displayed = stored == null
    ? ''
    : def.isPct
      ? String(Math.round(stored * 10000) / 100) // 0.105 → 10.5
      : String(stored);

  const [draft, setDraft] = useState(displayed);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resync if the upstream value changes (after another tab/edit)
  useEffect(() => setDraft(displayed), [displayed]);

  const commit = async () => {
    const num = Number(draft);
    if (!Number.isFinite(num) || num < 0) {
      setError('Число ≥ 0');
      return;
    }
    setError(null);
    const candidate = def.isPct ? num / 100 : num;
    if (candidate === stored) return;
    setSaving(true);
    try {
      await onSave(num);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 text-sm">
        <div className="flex-1">
          <div className={`${justSaved ? 'text-success font-medium' : 'text-foreground'} transition-colors`}>
            {def.label}
          </div>
          {def.helpText && <div className="text-[11px] text-muted">{def.helpText}</div>}
        </div>
        <input
          type="number"
          step="any"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          disabled={saving}
          className="w-28 bg-background border border-border rounded px-2 py-1 text-sm tabular-nums text-right focus:outline-none focus:border-accent disabled:opacity-50"
        />
        {def.unit && <span className="text-xs text-muted w-5">{def.unit}</span>}
      </div>
      {error && <div className="text-[11px] text-danger mt-1 text-right">{error}</div>}
    </div>
  );
}
