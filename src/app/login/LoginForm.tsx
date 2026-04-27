'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Неверный email или пароль');
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[380px] p-6 space-y-5 bg-surface border border-border rounded-lg"
      >
        <div className="text-center">
          <div className="text-2xl font-extrabold tracking-wide">DKR GROUP</div>
          <div className="text-xs text-muted mt-1">Войдите в свой аккаунт</div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Пароль</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {error && <div className="text-xs text-danger">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-accent text-white text-sm font-medium rounded hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Вход…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
