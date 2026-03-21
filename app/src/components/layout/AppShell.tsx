"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Home, CreditCard, Plane, BarChart2, Gift, User } from "lucide-react"
import { useState } from "react"

import { supabase } from "@/lib/supabase/client"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  desktopOnly?: boolean
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/projections", label: "Flights", icon: Plane },
  { href: "/spending", label: "Track", icon: BarChart2 },
  { href: "/recommendations", label: "Redeem", icon: Gift },
  { href: "/account", label: "Account", icon: User, desktopOnly: true },
]

const mobileItems = navItems.filter((item) => !item.desktopOnly)

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

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
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Desktop Sidebar */}
      <aside
        className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-white/5 md:flex"
        style={{ background: "var(--surface-container-low)" }}
      >
        {/* Logo */}
        <div className="px-6 py-6">
          <Link href="/dashboard" className="block">
            <div className="text-xl font-bold tracking-tighter" style={{ color: "var(--primary)" }}>
              Reward Relay
            </div>
            <div
              className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "#64748b" }}
            >
              The Financial Luminary
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            if (item.href === "/account") {
              return (
                <button
                  key={item.href}
                  onClick={signingOut ? undefined : handleSignOut}
                  disabled={signingOut}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "border border-white/5 text-[#4edea3]"
                      : "text-slate-400 hover:bg-[#313442] hover:text-white"
                  }`}
                  style={active ? { background: "var(--surface-container)" } : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "border border-white/5 text-[#4edea3]"
                    : "text-slate-400 hover:bg-[#313442] hover:text-white"
                }`}
                style={active ? { background: "var(--surface-container)" } : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Header */}
      <header
        className="sticky top-0 z-20 flex items-center px-4 py-3 md:hidden"
        style={{ background: "var(--surface-container-low)" }}
      >
        <Link href="/dashboard" className="block">
          <div className="text-base font-bold tracking-tighter" style={{ color: "var(--primary)" }}>
            Reward Relay
          </div>
        </Link>
      </header>

      {/* Main content */}
      <div className="min-h-screen md:pl-64">
        <main className="min-w-0 p-6 pb-24 md:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 backdrop-blur md:hidden"
        style={{ background: "var(--surface-container-low)" }}
      >
        <div className="grid grid-cols-5 px-2 py-1">
          {mobileItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center gap-1 rounded-lg px-1 py-2 transition-colors"
                style={{ color: active ? "#4edea3" : "#94a3b8" }}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
