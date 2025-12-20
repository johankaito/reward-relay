import { cookies } from "next/headers"
import { createServerClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database.types"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error("Missing Supabase env vars")
}

export function getSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: Parameters<typeof cookieStore.set>[0]) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: Parameters<typeof cookieStore.set>[0]) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 })
      },
    },
  })
}
