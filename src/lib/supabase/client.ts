/**
 * Browser-side Supabase client.
 * Uses the publishable (anon) key — safe to expose to the client.
 * Use this in client components and hooks.
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
    );
  }

  return createBrowserClient(url, key);
}
