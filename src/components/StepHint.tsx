'use client';

import { useHints } from '@/context/HintsContext';

interface StepHintProps {
  children: React.ReactNode;
}

export function StepHint({ children }: StepHintProps) {
  const { hintsEnabled } = useHints();
  if (!hintsEnabled) return null;

  return (
    <div
      className="flex gap-2.5 p-3 mb-4 rounded-md border-l-4 border-blue-400"
      style={{ background: 'var(--hint-bg)', color: 'var(--hint-text)' }}
    >
      <svg className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <p className="text-sm">{children}</p>
    </div>
  );
}
