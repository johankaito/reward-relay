import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database.types"

const PROTECTED_PATHS = ["/dashboard", "/cards"]
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function middleware(request: NextRequest) {
  if (!url || !anonKey) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path))
  const response = NextResponse.next()

  if (!isProtected) return response

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        response.cookies.set(name, value, options)
      },
      remove(name: string, options: any) {
        response.cookies.set(name, "", { ...options, maxAge: 0 })
      },
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ["/dashboard", "/cards", "/cards/:path*"],
}
