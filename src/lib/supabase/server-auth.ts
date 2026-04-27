/**
 * Server-component Supabase client that carries the user's auth session
 * via Next.js cookies. Use this in Server Components and Server Actions
 * inside /admin/* to read user info or perform authenticated DB calls.
 *
 * NOT to be confused with `server.ts` which uses the service-role key
 * (bypasses RLS) and is only safe in scripts / private API routes.
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function createAuthServerClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase env vars in server-auth');
  }

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Setting cookies inside a Server Component is a no-op — the
          // session is refreshed by middleware on the next request.
        }
      },
    },
  });
}
