"use client"

import { usePathname } from "next/navigation"
import { Footer } from "./Footer"

// Pages that show the footer (public/marketing pages only)
const FOOTER_PATHS = ["/terms", "/privacy", "/blog"]

export function ConditionalFooter() {
  const pathname = usePathname()
  if (!FOOTER_PATHS.includes(pathname)) return null
  return <Footer />
}
