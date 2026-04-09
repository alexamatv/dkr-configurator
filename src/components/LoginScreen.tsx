'use client';

import { useState } from 'react';

interface Props {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="text-4xl font-extrabold tracking-wide text-white">
          DKR GROUP
        </div>
        <h1 className="text-2xl font-bold text-white">
          Калькулятор КП
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя сотрудника"
            className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder:text-[#666] text-sm focus:outline-none focus:border-[#0061FE]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder:text-[#666] text-sm focus:outline-none focus:border-[#0061FE]"
          />
          <button
            onClick={onLogin}
            className="w-full bg-[#0061FE] hover:bg-[#2979FF] text-white font-medium py-3 rounded-lg transition-colors"
          >
            Войти
          </button>
        </div>
      </div>
    </div>
  );
}
