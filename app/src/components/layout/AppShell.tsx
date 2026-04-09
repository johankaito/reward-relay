"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { LogOut } from "lucide-react"
import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase/client"

type NavItem = {
  href: string
  label: string
  materialIcon: string
}

const navItems: NavItem[] = [
  { label: "Home",    href: "/dashboard", materialIcon: "home"        },
  { label: "Cards",   href: "/cards",     materialIcon: "credit_card" },
  { label: "Track",   href: "/spending",  materialIcon: "monitoring"  },
  { label: "Redeem",  href: "/flights",   materialIcon: "redeem"      },
  { label: "Account", href: "/settings",  materialIcon: "person"      },
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

  const isTestUser = userEmail?.includes("rewardrelay-test") ?? false
  const displayName = isTestUser ? "Alex Rivera" : (userEmail?.split("@")[0] ?? "")
  const displayInitials = displayName.split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase() || "U"
  const avatarUrl = isTestUser
    ? "https://lh3.googleusercontent.com/aida-public/AB6AXuCkMVpPuJI6awhxz_wpQdjLYUL9LlHc0TQnhScipKHCqg374kt2ay2V9Xd85VKQr5zGuOFRqx3OaBlyPZNCuatGBmsrELKCEaX1vozS_bFEudJYU-98vOcxdUwUxqTsrvtoUjWgTGqav4WioqexrH9D5ZYW5Dir4qEONkgjIwcN1MiSFuVwvNtf_DQ5uF6JQGc1rkqhMuWE_XTp9jUa6_OhhmPooRPHP7QavNGojIuwF2JD6XYGZTFO2V1kN8lpvqhPeufON_iqa2lT"
    : null

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

  const isActive = (href: string) => {
    if (href === "/spending" && pathname === "/tracker") return true
    if (href === "/spending" && pathname.startsWith("/tracker/")) return true
    if (href === "/spending" && pathname === "/profit") return true
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--surface)" }}>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:flex flex-col border-r border-white/5 bg-[#171b28] h-screen w-64 fixed left-0 top-0 overflow-y-auto z-50 antialiased tracking-tight">
        <div className="p-8 flex flex-col h-full">
          {/* Logo */}
          <div className="mb-10">
            <h1 className="text-xl font-bold tracking-tighter text-[#4edea3]">Reward Relay</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">The Financial Luminary</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-2">
            {navItems.map(({ href, label, materialIcon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 transition-all text-sm ${
                    active
                      ? "bg-surface-container text-primary font-bold rounded-xl px-5 py-3.5"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-lg px-4 py-3"
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>{materialIcon}</span>
                  <span className="font-medium">{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Add New Card CTA */}
          <div className="mt-auto pt-10">
            <button
              onClick={() => router.push("/cards")}
              className="w-full py-4 rounded-full font-bold transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg text-sm"
              style={{ background: "linear-gradient(135deg, #4edea3 0%, #10b981 100%)", color: "#003824" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
              Add New Card
            </button>
          </div>

          {/* User profile */}
          <div className="mt-auto pt-8">
            {userEmail && (
              <div className="bg-surface-container rounded-xl p-4 flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span
                      className="text-sm font-bold flex items-center justify-center w-full h-full"
                      style={{ background: "linear-gradient(135deg, #4edea3 0%, #10b981 100%)", color: "#0f131f" }}
                    >
                      {displayInitials}
                    </span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-on-surface truncate">{displayName}</span>
                  <span className="text-[10px] text-[#4edea3] uppercase tracking-widest">Platinum Tier</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="mt-3 flex items-center gap-2 w-full px-2 py-1 text-xs rounded-lg transition-all hover:bg-white/5 disabled:opacity-50 opacity-0 hover:opacity-100 text-slate-600 hover:text-slate-400"
            >
              <LogOut className="h-3 w-3 flex-shrink-0" />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>

          {/* Footer disclaimer */}
          <div className="pt-4 border-t border-white/5">
            <a href="/terms" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Not financial advice
            </a>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header
        className="fixed top-0 w-full z-40 md:hidden flex justify-between items-center h-16 px-6"
        style={{ background: "#171b28" }}
      >
        <Link href="/dashboard">
          <span className="text-xl font-black" style={{ color: "#4edea3" }}>Reward Relay</span>
        </Link>
        <div className="flex gap-4">
          <button aria-label="Notifications">
            <span className="material-symbols-outlined text-slate-400">notifications</span>
          </button>
          <button aria-label="Settings" onClick={() => router.push("/settings")}>
            <span className="material-symbols-outlined text-slate-400">settings</span>
          </button>
        </div>
      </header>

      {/* Desktop top-right header bar */}
      <header className="hidden md:flex fixed top-0 right-0 z-40 items-center gap-3 px-6 h-16" style={{ left: 288 }}>
        <div className="flex-1">
          <div className="relative max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" style={{ fontSize: "18px" }}>search</span>
            <input
              type="text"
              placeholder="Search rewards..."
              className="w-full h-9 pl-9 pr-4 rounded-full bg-[#1b1f2c] border border-white/5 text-sm text-on-surface placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#4edea3]/30"
            />
          </div>
        </div>
        <button aria-label="Notifications" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: "22px" }}>notifications</span>
        </button>
        <button aria-label="Settings" onClick={() => router.push("/settings")} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: "22px" }}>settings</span>
        </button>
        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(135deg, #4edea3 0%, #10b981 100%)", color: "#0f131f" }}>
              {displayInitials}
            </div>
          )}
        </div>
      </header>

      {/* Page content */}
      <div className="pt-16 md:pl-64 pb-24 md:pb-6 min-w-0">
        <main className="min-w-0 overflow-x-hidden px-6 md:px-10 py-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 md:hidden"
        style={{
          background: "rgba(15,19,31,0.80)",
          backdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <div className="grid grid-cols-5 pb-safe" style={{ minHeight: 80 }}>
          {navItems.map(({ href, label, materialIcon }) => {
            const active = isActive(href)
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors active:bg-white/5 ${
                  active ? "text-primary" : "text-slate-500"
                }`}
              >
                <span
                  className={`material-symbols-outlined transition-transform ${active ? "scale-110" : ""}`}
                  style={{ fontSize: "22px" }}
                >
                  {materialIcon}
                </span>
                <span className="text-[10px] font-semibold tracking-widest uppercase leading-tight">
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
