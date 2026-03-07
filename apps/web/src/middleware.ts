import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check either the HttpOnly API cookie (local dev) or the marker cookie set
  // client-side after login (production cross-origin, where the API cookie is blocked).
  // We only verify authentication here — role-based routing is handled client-side
  // because the JWT role can be stale (admin may promote a user between logins).
  const token = request.cookies.get('token') || request.cookies.get('tms_auth');

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/manager/:path*', '/clerk/:path*', '/employee/:path*'],
};
