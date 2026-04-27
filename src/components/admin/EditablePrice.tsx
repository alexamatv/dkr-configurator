'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  onSave: (next: number) => Promise<void>;
  // Optional shorter input width for tighter columns
  compact?: boolean;
}

/**
 * Inline numeric editor. Click the pencil to edit, Enter or ✓ to save,
 * Escape or ✗ to cancel. Shows a green flash for 1s after a successful save.
 */
export function EditablePrice({ value, onSave, compact = false }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  // Keep draft in sync if the upstream value changes (e.g. after refresh).
  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  const start = () => {
    setError(null);
    setDraft(String(value));
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(String(value));
    setError(null);
  };

  const commit = async () => {
    const next = Number(draft);
    if (!Number.isFinite(next) || next < 0) {
      setError('Цена должна быть числом ≥ 0');
      return;
    }
    if (next === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(next);
      setEditing(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="number"
          min={0}
          step={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void commit();
            if (e.key === 'Escape') cancel();
          }}
          disabled={saving}
          className={`bg-background border border-accent rounded px-2 py-1 text-sm tabular-nums focus:outline-none ${
            compact ? 'w-24' : 'w-32'
          }`}
        />
        <button
          onClick={() => void commit()}
          disabled={saving}
          className="text-xs px-2 py-1 bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50"
          title="Сохранить (Enter)"
        >
          {saving ? '…' : '✓'}
        </button>
        <button
          onClick={cancel}
          disabled={saving}
          className="text-xs px-2 py-1 border border-border rounded hover:bg-surface-hover disabled:opacity-50"
          title="Отменить (Escape)"
        >
          ✗
        </button>
        {error && <span className="text-[11px] text-danger ml-2">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`tabular-nums text-sm transition-colors ${
          justSaved ? 'text-success font-bold' : ''
        }`}
      >
        {value.toLocaleString('ru-RU')} ₽
      </span>
      <button
        onClick={start}
        className="text-xs text-muted hover:text-accent transition-colors"
        title="Редактировать"
      >
        ✎
      </button>
    </div>
  );
}
