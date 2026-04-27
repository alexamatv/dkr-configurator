import { redirect } from 'next/navigation';
import { createAuthServerClient } from '@/lib/supabase/server-auth';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense-in-depth: middleware already redirects, but if it's misconfigured
  // this prevents the page from rendering for an unauthenticated user.
  if (!user) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminHeader email={user.email ?? ''} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
