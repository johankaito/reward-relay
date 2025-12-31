"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Home, LayoutGrid, LogOut, Menu, Shield, Sparkles, History, Calculator, Wallet, Calendar, FileUp } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/cards", label: "Cards", icon: LayoutGrid },
  { href: "/spending", label: "Spending", icon: Wallet },
  { href: "/statements", label: "Statements", icon: FileUp },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/history", label: "History", icon: History },
  { href: "/compare", label: "Compare", icon: Calculator },
]

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const navMap = useMemo(
    () =>
      navItems.map((item) => ({
        ...item,
        active: pathname.startsWith(item.href),
      })),
    [pathname],
  )

  const handleSignOut = async () => {
    setSigningOut(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message || "Sign out failed")
      setSigningOut(false)
      return
    }
    router.replace("/login")
  }

  return (
    <div className="min-h-screen bg-[var(--surface-muted)] text-white">
      <header className="sticky top-0 z-20 border-b border-[var(--border-default)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Menu className="h-5 w-5 text-slate-200 md:hidden" />
            <Link href="/dashboard" className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-2xl text-white shadow-sm"
                style={{ background: "var(--gradient-cta)" }}
              >
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight text-white">Reward Relay</p>
                <p className="text-xs text-slate-300">AU churners</p>
              </div>
            </Link>
            <span
              className="hidden items-center gap-2 rounded-full px-3 py-1 text-xs font-medium md:inline-flex"
              style={{
                backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
                color: "var(--accent-strong)",
              }}
            >
              <Shield className="h-3 w-3" /> Private beta
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="hidden rounded-full text-white shadow-sm md:inline-flex"
              style={{ background: "var(--gradient-cta)" }}
              onClick={() => router.push("/cards")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Add card
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {signingOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[240px_1fr]">
        <Card className="hidden h-fit border border-[var(--border-default)] bg-[var(--surface)] text-white shadow-md md:block">
          <nav className="space-y-1 p-3">
            {navMap.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm transition ${
                    item.active
                      ? "bg-white/10 text-white ring-1 ring-[var(--border-default)]"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      item.active ? "bg-[var(--accent)]" : "bg-white/30"
                    }`}
                  />
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-4 space-y-2 border-t border-white/10 p-3 text-xs text-slate-300">
            <p className="font-semibold text-white">Next actions</p>
            <p>Track your AMEX + churn target</p>
            <p>Compare eligible cards</p>
          </div>
        </Card>

        <main className="space-y-6">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border-default)] bg-[var(--surface)]/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-around px-4 py-2 text-sm font-medium text-white">
          {navMap.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center gap-1 rounded-md px-3 py-2 transition-all ${
                  item.active ? "text-[var(--accent)]" : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
