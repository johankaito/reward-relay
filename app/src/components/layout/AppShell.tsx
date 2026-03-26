"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Home, CreditCard, BarChart2, Plane, Settings, LogOut, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: "Home",    href: "/dashboard", icon: Home      },
  { label: "Cards",   href: "/cards",     icon: CreditCard },
  { label: "Track",   href: "/spending",  icon: BarChart2  },
  { label: "Redeem",  href: "/flights",   icon: Plane      },
  { label: "Account", href: "/settings",  icon: Settings   },
]

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  const handleSignOut = async () => {
    setSigningOut(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message || "Sign out failed")
      setSigningOut(false)
      return
    }
    router.replace("/")
  }

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--surface)" }}>
      {/* ── Desktop fixed sidebar ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-surface-container-low z-40 flex-col overflow-y-auto font-headline antialiased tracking-tight">
        <div className="p-8 flex flex-col h-full">
          {/* Logo */}
          <div className="mb-10">
            <h1 className="text-xl font-bold tracking-tighter text-primary">Reward Relay</h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">The Financial Luminary</p>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? "bg-surface-container text-primary rounded-lg"
                      : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface rounded-lg"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="mt-auto p-4">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">The Financial Luminary</p>
            <Link
              href="/cards"
              className="block text-on-primary rounded-full px-4 py-2 text-sm font-semibold w-full text-center"
              style={{ background: "var(--gradient-cta)" }}
            >
              Add New Card
            </Link>

            {/* User info */}
            {userEmail && (
              <div className="mt-6 flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <span className="text-sm font-bold text-on-surface">{userEmail[0].toUpperCase()}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-on-surface truncate">{userEmail.split("@")[0]}</span>
                  <span className="text-xs text-on-surface-variant">Elite Tier</span>
                </div>
              </div>
            )}

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="mt-4 flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-lg transition-colors hover:bg-white/5 disabled:opacity-50 text-on-surface-variant"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 md:hidden"
        style={{
          background: "color-mix(in srgb, var(--surface-container-low) 95%, transparent)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
            style={{ background: "var(--gradient-cta)" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
            Reward Relay
          </span>
        </Link>
        <Button
          size="sm"
          className="rounded-full text-on-primary text-xs font-semibold px-4"
          style={{ background: "var(--gradient-cta)" }}
          onClick={() => router.push("/cards")}
        >
          Add card
        </Button>
      </header>

      {/* ── Page content ── */}
      <div className="md:pl-64 pb-24 md:pb-6 min-w-0">
        <main className="min-w-0 overflow-x-hidden">{children}</main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 md:hidden"
        style={{
          background: "color-mix(in srgb, var(--surface-container-low) 97%, transparent)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <div className="grid grid-cols-5 h-20 pb-safe" style={{ minHeight: 80 }}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`flex flex-col items-center gap-1 py-2 px-1 transition-colors active:bg-white/5 ${
                  active ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 transition-transform ${active ? "scale-110" : ""}`} />
                <span className="text-[9px] font-semibold tracking-widest uppercase leading-tight">
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
