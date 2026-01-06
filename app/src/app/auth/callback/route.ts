import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await getSupabaseServerClient()

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error.message)
      // Redirect to login with error
      return NextResponse.redirect(new URL('/login?error=confirmation_failed', requestUrl.origin))
    }
  }

  // Successful confirmation - redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
