import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const allowedIps = (process.env.STAGING_ALLOWED_IPS ?? "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean)

  // STAGING_ALLOWED_IPS not set → production, no restriction
  if (allowedIps.length === 0) {
    return NextResponse.next()
  }

  // x-forwarded-for may be a comma-separated list; take the first (client) IP
  const forwardedFor = request.headers.get("x-forwarded-for")
  const ip = forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? ""

  if (!allowedIps.includes(ip)) {
    return new NextResponse("Access denied", { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except static assets and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
