'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = document.documentElement.getAttribute('data-theme') as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  const select = (t: Theme) => {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
  };

  return (
    <div className="flex items-center h-8 w-40 rounded-full bg-border p-0.5 shrink-0">
      <button
        onClick={() => select('light')}
        className={`flex-1 h-full rounded-full text-xs font-semibold transition-all duration-200 ${
          theme === 'light'
            ? 'bg-accent text-white'
            : 'bg-transparent text-muted'
        }`}
      >
        Светлая
      </button>
      <button
        onClick={() => select('dark')}
        className={`flex-1 h-full rounded-full text-xs font-semibold transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-accent text-white'
            : 'bg-transparent text-muted'
        }`}
      >
        Тёмная
      </button>
    </div>
  );
}
