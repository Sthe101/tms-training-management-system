import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/admin', '/manager', '/clerk'];

export function middleware(request: NextRequest) {
  // Check either the HttpOnly API cookie (local dev) or the marker cookie set
  // client-side after login (production cross-origin, where the API cookie is blocked)
  const token = request.cookies.get('token') || request.cookies.get('tms_auth');
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/manager/:path*', '/clerk/:path*'],
};
