'use client';

interface Props {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

/**
 * Compact `[−] [N] [+]` quantity stepper used everywhere in the wizard
 * where a per-item count is editable. Keeps numerics clamped to [min, max].
 */
export function QuantityInput({ value, onChange, min = 1, max, disabled = false }: Props) {
  const clamp = (n: number) => {
    if (max != null) n = Math.min(max, n);
    return Math.max(min, n);
  };
  const dec = () => onChange(clamp(value - 1));
  const inc = () => onChange(clamp(value + 1));

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        className="w-8 h-8 shrink-0 rounded bg-border/50 hover:bg-border flex items-center justify-center text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Уменьшить"
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10) || min))}
        className="w-16 h-8 text-center tabular-nums bg-surface border border-border rounded text-sm focus:outline-none focus:border-accent disabled:opacity-50"
      />
      <button
        type="button"
        onClick={inc}
        disabled={disabled || (max != null && value >= max)}
        className="w-8 h-8 shrink-0 rounded bg-border/50 hover:bg-border flex items-center justify-center text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Увеличить"
      >
        +
      </button>
    </div>
  );
}
