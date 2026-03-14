"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Home,
  CreditCard,
  LogOut,
  Sparkles,
  Wallet,
  CalendarDays,
  Compass,
  ChevronRight,
  TrendingUp,
  Upload,
  History,
  Scale,
  Lightbulb,
  Calendar,
  Search,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"

type NavChild = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavChild[]
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
  },
  {
    href: "/cards",
    label: "Cards",
    icon: CreditCard,
    children: [
      { href: "/cards", label: "Catalog", icon: CreditCard },
      { href: "/inquiries", label: "Inquiries", icon: Search },
    ],
  },
  {
    href: "/recommendations",
    label: "Discover",
    icon: Compass,
    children: [
      { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
      { href: "/compare", label: "Compare", icon: Scale },
      { href: "/projections", label: "Projections", icon: TrendingUp },
    ],
  },
  {
    href: "/tracker",
    label: "Spending",
    icon: Wallet,
    children: [
      { href: "/tracker", label: "Tracker", icon: Wallet },
      { href: "/statements", label: "Import Statements", icon: Upload },
    ],
  },
  {
    href: "/calendar",
    label: "Timeline",
    icon: CalendarDays,
    children: [
      { href: "/calendar", label: "Calendar", icon: Calendar },
      { href: "/history", label: "History", icon: History },
    ],
  },
]

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const navMap = useMemo(() => {
    return navItems.map((item) => {
      const isParentActive = pathname.startsWith(item.href)
      const isChildActive = item.children?.some((c) => pathname.startsWith(c.href)) ?? false
      const active = isParentActive || isChildActive

      return {
        ...item,
        active,
        children: item.children?.map((child) => ({
          ...child,
          active: pathname.startsWith(child.href),
        })),
      }
    })
  }, [pathname])

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

  return (
    <div className="min-h-screen bg-[var(--surface-muted)]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--border-default)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ background: "var(--gradient-cta)" }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">Reward Relay</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              className="hidden rounded-full text-white shadow-sm md:inline-flex"
              style={{ background: "var(--gradient-cta)" }}
              onClick={() => router.push("/cards")}
            >
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              Add card
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 pb-24 md:grid-cols-[220px_1fr] md:pb-6">
        {/* Desktop Sidebar */}
        <aside className="hidden h-fit md:block">
          <nav className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-2 shadow-sm">
            {navMap.map((item) => {
              const Icon = item.icon
              const hasChildren = !!(item.children && item.children.length > 0)
              const showChildren = hasChildren && item.active

              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      item.active
                        ? "bg-[var(--surface-strong)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 ${
                        item.active ? "text-[var(--accent)]" : ""
                      }`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {hasChildren && (
                      <ChevronRight
                        className={`h-3.5 w-3.5 transition-transform ${
                          item.active
                            ? "rotate-90 text-[var(--text-secondary)]"
                            : "text-[var(--text-secondary)]/40"
                        }`}
                      />
                    )}
                  </Link>

                  {/* Sub-items: shown when parent is active */}
                  {showChildren && item.children && (
                    <div className="mb-1 ml-4 space-y-0.5 border-l border-[var(--border-default)] pl-2.5 pt-0.5">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                              child.active
                                ? "bg-[var(--surface-strong)] font-medium text-[var(--text-primary)]"
                                : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
                            }`}
                          >
                            <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0 space-y-5">{children}</main>
      </div>

      {/* Mobile Bottom Nav — exactly 5 items, no scroll */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border-default)] bg-[var(--surface)]/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-sm grid-cols-5 px-2 py-1">
          {navMap.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 transition-colors ${
                  item.active
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
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
