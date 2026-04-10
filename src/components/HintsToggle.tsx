'use client';

import { useHints } from '@/context/HintsContext';

export function HintsToggle() {
  const { hintsEnabled, setHintsEnabled } = useHints();

  return (
    <div className="space-y-1">
      <span className="text-[10px] text-muted uppercase tracking-wide">Подсказки</span>
      <div className="flex items-center h-7 w-full max-w-[160px] rounded-full bg-border p-0.5 shrink-0">
        <button
          onClick={() => setHintsEnabled(true)}
          className={`flex-1 h-full rounded-full text-xs font-semibold transition-all duration-200 ${
            hintsEnabled
              ? 'bg-accent text-white'
              : 'bg-transparent text-muted'
          }`}
        >
          Вкл
        </button>
        <button
          onClick={() => setHintsEnabled(false)}
          className={`flex-1 h-full rounded-full text-xs font-semibold transition-all duration-200 ${
            !hintsEnabled
              ? 'bg-accent text-white'
              : 'bg-transparent text-muted'
          }`}
        >
          Выкл
        </button>
      </div>
    </div>
  );
}
