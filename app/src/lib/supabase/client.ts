import { createBrowserClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database.types"

// Use placeholders during build time if env vars not available
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key-for-build"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set. Using placeholders for build.")
}

export const supabase = createBrowserClient<Database>(url, anonKey)
