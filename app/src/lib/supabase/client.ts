import { createBrowserClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database.types"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error("Missing Supabase env vars")
}

export const supabase = createBrowserClient<Database>(url, anonKey)
