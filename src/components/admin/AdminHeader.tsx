'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  email: string;
}

export function AdminHeader({ email }: Props) {
  const router = useRouter();

  const onSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="border-b border-border bg-surface">
      <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-medium text-muted tracking-wider">DKR GROUP</span>
          <span className="text-sm font-bold">Админ-панель</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/"
            className="text-xs text-accent hover:underline"
          >
            ← Калькулятор
          </Link>
          <span className="text-muted hidden sm:inline">{email}</span>
          <button
            onClick={onSignOut}
            className="px-3 py-1.5 border border-border rounded text-xs hover:bg-surface-hover transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}
