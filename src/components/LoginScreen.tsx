'use client';

import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="text-4xl font-extrabold tracking-wide text-foreground">
          DKR GROUP
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Калькулятор КП
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя сотрудника"
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-placeholder text-sm focus:outline-none focus:border-accent"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-placeholder text-sm focus:outline-none focus:border-accent"
          />
          <button
            onClick={onLogin}
            className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-3 rounded-lg transition-colors"
          >
            Войти
          </button>
        </div>
      </div>
    </div>
  );
}
