/**
 * Guards every page (calculator + admin). Only /login is public.
 * Unauthenticated requests get redirected to /login?next=<original path>.
 * Legacy /admin/login URL is permanently redirected to /login.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Legacy alias — keep old bookmarks working
  if (pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // /login is the only public page
  if (pathname === '/login') {
    return NextResponse.next();
  }

  const { supabase, res } = createMiddlewareClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', req.url);
    // Preserve where the user was trying to go so we can send them back after login
    loginUrl.searchParams.set('next', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  // Run on every page request except static assets and the Next.js internals.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
