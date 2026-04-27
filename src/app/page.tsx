import { Wizard } from '@/components/Wizard';
import { DataProvider } from '@/context/DataContext';
import { createAuthServerClient } from '@/lib/supabase/server-auth';

export default async function Home() {
  // Middleware already redirects unauthenticated requests to /login,
  // so by the time this renders we have a real user.
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const meta = (user?.user_metadata ?? {}) as { full_name?: string; name?: string };
  const managerName = meta.full_name || meta.name || user?.email || '';

  return (
    <DataProvider>
      <Wizard initialManager={managerName} userEmail={user?.email ?? ''} />
    </DataProvider>
  );
}
