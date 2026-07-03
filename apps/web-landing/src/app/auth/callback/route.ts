import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    // Instantiate a standalone client to handle code exchange in api context
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      }
    });

    const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);
    
    if (!error && data.session) {
      // Fetch user profile to redirect to correct role portal
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single();

      const userRole = profile?.role || 'customer';
      
      const response = NextResponse.redirect(`${origin}${userRole === 'provider' ? '/provider' : '/customer'}`);
      
      // Store tokens in cookies for server middleware
      response.cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        secure: true,
        sameSite: 'lax',
        maxAge: data.session.expires_in,
      });
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      
      return response;
    }
  }

  // Return the user to an error page or home page if exchange fails
  return NextResponse.redirect(`${origin}/auth/login?error=Verification failed`);
}
