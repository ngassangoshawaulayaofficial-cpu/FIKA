import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('sb-access-token')?.value;

  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Define route scopes
  const isCustomerRoute = path.startsWith('/customer');
  const isProviderRoute = path.startsWith('/provider');
  const isAuthRoute = path.startsWith('/auth');

  if (!token) {
    if (isCustomerRoute || isProviderRoute) {
      url.pathname = '/auth/login';
      url.searchParams.set('redirectedFrom', path);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  try {
    // Validate session via direct REST request to avoid Node.js API imports on Edge Runtime
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Invalid token session');
    }

    const user = await userResponse.json();
    const role = user.user_metadata?.role || 'customer';

    if (isAuthRoute) {
      url.pathname = role === 'provider' ? '/provider' : '/customer';
      return NextResponse.redirect(url);
    }

    if (isCustomerRoute && role !== 'customer' && role !== 'admin') {
      url.pathname = '/provider';
      return NextResponse.redirect(url);
    }

    if (isProviderRoute && role !== 'provider' && role !== 'admin') {
      url.pathname = '/customer';
      return NextResponse.redirect(url);
    }
  } catch {
    if (isCustomerRoute || isProviderRoute) {
      const response = NextResponse.redirect(new URL('/auth/login', req.url));
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/customer/:path*', '/provider/:path*', '/auth/:path*'],
};
