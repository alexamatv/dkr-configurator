'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'lines';

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { label: string; value: string }[]; // select only
  placeholder?: string;
  helpText?: string;
  defaultValue?: unknown;
}

interface Props {
  table: string;
  title: string;
  fields: FieldConfig[];
  /** When set, the form opens in edit mode and updates the row at this id. */
  editingId?: string;
  initialValues?: Record<string, unknown>;
  /** Returns true if another active row in the same branch already uses `name`. */
  isNameTaken?: (name: string, formValues: Record<string, unknown>) => boolean;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Generic create/edit form modal. Pass a list of FieldConfig + the Supabase
 * table name; on save it INSERTs (or UPDATEs when editingId is set) and calls
 * onSaved so the parent can refetch.
 *
 * For new rows the `id` is auto-generated as `<table-prefix>_<base36 timestamp>`
 * unless the user explicitly enters one in a field named `id`.
 */
export function ItemModal({ table, title, fields, editingId, initialValues, isNameTaken, onClose, onSaved }: Props) {
  const isEdit = Boolean(editingId);

  const initial = useMemo(() => {
    const v: Record<string, unknown> = {};
    for (const f of fields) {
      if (initialValues && f.name in initialValues) {
        const raw = initialValues[f.name];
        if (f.type === 'lines' && Array.isArray(raw)) {
          v[f.name] = raw.join('\n');
        } else if (f.type === 'checkbox') {
          v[f.name] = Boolean(raw);
        } else if (raw === null || raw === undefined) {
          v[f.name] = '';
        } else {
          v[f.name] = raw;
        }
      } else if (f.defaultValue !== undefined) {
        v[f.name] = f.defaultValue;
      } else {
        v[f.name] = f.type === 'checkbox' ? false : f.type === 'number' ? '' : '';
      }
    }
    return v;
  }, [fields, initialValues]);

  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (name: string, v: unknown) =>
    setValues((prev) => ({ ...prev, [name]: v }));

  const submit = async () => {
    // Required-field check
    for (const f of fields) {
      if (!f.required) continue;
      const v = values[f.name];
      if (v === '' || v === null || v === undefined) {
        setError(`Поле «${f.label}» обязательно`);
        return;
      }
    }

    // Duplicate-name check (skips when we're editing and the row already
    // owns this name — handled by the parent's isNameTaken logic if needed)
    if (!isEdit && isNameTaken) {
      const candidateName = String(values.name ?? '').trim();
      if (candidateName && isNameTaken(candidateName, values)) {
        setError('Позиция с таким названием уже существует в этой ветке');
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      // Coerce values per field type
      const row: Record<string, unknown> = {};
      for (const f of fields) {
        const raw = values[f.name];
        if (f.type === 'number') {
          row[f.name] = raw === '' || raw === null || raw === undefined ? null : Number(raw);
        } else if (f.type === 'checkbox') {
          row[f.name] = Boolean(raw);
        } else if (f.type === 'lines') {
          row[f.name] = String(raw ?? '')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
        } else {
          row[f.name] = raw === '' ? null : raw;
        }
      }

      const supabase = createClient();
      if (isEdit) {
        const { error: e } = await supabase.from(table).update(row).eq('id', editingId);
        if (e) throw e;
      } else {
        // Auto-generate id if not provided
        if (!row.id || row.id === '') {
          row.id = `${table.split('_')[0]}_${Date.now().toString(36).slice(-6)}`;
        }
        // Default to active and zero sort_order if not in form
        if (!('is_active' in row)) row.is_active = true;
        if (!('sort_order' in row)) row.sort_order = 0;
        const { error: e } = await supabase.from(table).insert(row);
        if (e) throw e;
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-lg w-full max-w-[560px] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm">
            {isEdit ? 'Редактировать' : 'Добавить'} — {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-hover text-muted"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {fields.map((f) => (
            <Field key={f.name} field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} />
          ))}
          {error && <div className="text-xs text-danger">{error}</div>}
        </div>

        <div className="sticky bottom-0 bg-surface px-5 py-3 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-1.5 text-sm border border-border rounded hover:bg-surface-hover disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={() => void submit()}
            disabled={saving}
            className="px-4 py-1.5 text-sm bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const labelEl = (
    <label className="block text-xs font-medium text-muted mb-1">
      {field.label}
      {field.required && <span className="text-danger ml-1">*</span>}
    </label>
  );
  const helpEl = field.helpText ? (
    <div className="text-[11px] text-muted mt-1">{field.helpText}</div>
  ) : null;

  if (field.type === 'checkbox') {
    return (
      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 accent-accent"
          />
          {field.label}
        </label>
        {helpEl}
      </div>
    );
  }
  if (field.type === 'select') {
    return (
      <div>
        {labelEl}
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
        >
          <option value="">— Выберите —</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {helpEl}
      </div>
    );
  }
  if (field.type === 'textarea' || field.type === 'lines') {
    return (
      <div>
        {labelEl}
        <textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.type === 'lines' ? 6 : 3}
          className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent resize-y"
        />
        {helpEl}
      </div>
    );
  }
  return (
    <div>
      {labelEl}
      <input
        type={field.type}
        value={String(value ?? '')}
        onChange={(e) => onChange(field.type === 'number' ? e.target.value : e.target.value)}
        placeholder={field.placeholder}
        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
      />
      {helpEl}
    </div>
  );
}
