"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Home, CreditCard, Wallet, Plane, User, LogOut, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: "Home",    href: "/dashboard", icon: Home       },
  { label: "Cards",   href: "/cards",     icon: CreditCard },
  { label: "Track",   href: "/spending",  icon: Wallet     },
  { label: "Redeem",  href: "/flights",   icon: Plane      },
  { label: "Account", href: "/settings",  icon: User       },
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
      <aside
        className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col z-30"
        style={{ background: "#171b28", borderRight: "1px solid rgba(255,255,255,0.05)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm flex-shrink-0"
            style={{ background: "var(--gradient-cta)" }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
              Reward Relay
            </p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.6)" }}>
              The Financial Luminary
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-surface-container text-primary"
                    : "text-slate-400 hover:bg-surface-container-highest hover:text-on-surface"
                }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "scale-110" : ""}`} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 pb-5 space-y-3">
          {/* User info */}
          {userEmail && (
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0"
                style={{ background: "var(--primary-container)", color: "var(--on-primary)" }}
              >
                {userEmail[0].toUpperCase()}
              </div>
              <p className="text-xs truncate" style={{ color: "rgba(148,163,184,0.7)" }}>
                {userEmail}
              </p>
            </div>
          )}

          {/* "The Financial Luminary" label */}
          <p className="text-[10px] uppercase tracking-widest px-2" style={{ color: "rgba(148,163,184,0.4)" }}>
            The Financial Luminary
          </p>

          {/* Add New Card pill */}
          <button
            onClick={() => router.push("/cards")}
            className="w-full rounded-full py-2 px-4 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--gradient-cta)", color: "#003824" }}
          >
            + Add New Card
          </button>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-lg transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ color: "rgba(148,163,184,0.5)" }}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 md:hidden"
        style={{
          background: "rgba(23,27,40,0.95)",
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
          background: "rgba(23,27,40,0.97)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <div className="grid grid-cols-5 h-20 pb-safe">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`flex flex-col items-center gap-1 py-2 px-1 transition-colors active:bg-white/5 ${
                  active ? "text-primary" : "text-slate-400"
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
