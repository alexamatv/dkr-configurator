/**
 * Browser-side Supabase client.
 * Uses the publishable (anon) key — safe to expose to the client.
 * Use this in client components and hooks.
 *
 * Canonical env name: NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is also accepted as a legacy fallback.
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createBrowserClient(url, key);
}
