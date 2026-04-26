/**
 * Server-side Supabase client with service-role privileges.
 * NEVER import this in a client component — it would leak the secret key.
 * Use only in server actions, API routes, scripts, and middleware.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY'
    );
  }

  return createSupabaseClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
