import { redirect } from 'next/navigation';
import { createAuthServerClient } from '@/lib/supabase/server-auth';
import { LoginForm } from './LoginForm';

export default async function LoginPage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Already signed in? Skip the form and go straight to the calculator.
  if (user) redirect('/');
  return <LoginForm />;
}
