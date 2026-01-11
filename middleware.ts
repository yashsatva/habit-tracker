import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isOnDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  const isOnAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup');
  
  // Check for NextAuth session cookie (NextAuth v5 uses 'authjs.session-token' or '__Secure-authjs.session-token')
  // Also check for 'next-auth.session-token' for backwards compatibility
  const sessionToken = 
    request.cookies.get('authjs.session-token') || 
    request.cookies.get('__Secure-authjs.session-token') ||
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token');

  const isLoggedIn = !!sessionToken;

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isOnAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|$).*)'],
};

