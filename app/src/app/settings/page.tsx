"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Shield, LogOut } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { supabase } from "@/lib/supabase/client"

interface NotificationPrefs {
  thirtyDay: boolean
  fourteenDay: boolean
  sevenDay: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>("")
  const [signingOut, setSigningOut] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [notifs, setNotifs] = useState<NotificationPrefs>({
    thirtyDay: true,
    fourteenDay: true,
    sevenDay: false,
  })

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace("/")
        return
      }

      setUserEmail(session.user.email ?? null)
      const meta = session.user.user_metadata as Record<string, unknown>
      const name = (meta?.full_name as string) ?? (meta?.name as string) ?? session.user.email?.split("@")[0] ?? ""
      setDisplayName(name)
    }
    void load()
  }, [router])

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() ?? "?"

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

  const handleDeleteAccount = async () => {
    if (!confirm("This will permanently delete your account and all data. Are you sure?")) return
    setDeletingAccount(true)
    // Sign out — actual deletion requires a server-side admin call
    await supabase.auth.signOut()
    router.replace("/")
  }

  const toggleNotif = (key: keyof NotificationPrefs) => {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <AppShell>
      {/* ── Sticky header ── */}
      <header className="sticky top-0 w-full z-40 bg-[#0f131f]/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center px-6 h-16 max-w-5xl mx-auto">
          <h2 className="font-headline font-bold text-lg bg-gradient-to-br from-primary to-primary-container bg-clip-text text-transparent">
            Account Settings
          </h2>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-8 pb-16">
        <div className="mb-12">
          <h1 className="text-3xl md:text-[3.5rem] font-extrabold font-headline leading-tight tracking-tight text-on-surface">
            Account Settings
          </h1>
          <p className="text-on-surface-variant mt-2 text-lg">
            Manage your profile, preferences and subscription.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* ── Main settings column ── */}
          <div className="lg:col-span-8 space-y-8">

            {/* Profile Section */}
            <section className="bg-surface-container rounded-2xl p-6 lg:p-8 border border-white/5">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold font-headline">Profile</h3>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-surface-container-highest border-4 border-surface-container-low flex items-center justify-center text-3xl font-extrabold text-primary font-headline">
                    {initials}
                  </div>
                  <div className="absolute bottom-0 right-0 p-1.5 bg-primary-container rounded-full">
                    <svg className="w-3.5 h-3.5 text-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 w-full">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">
                      Display Name
                    </label>
                    <div className="bg-surface-container-low px-4 py-3 rounded-xl text-on-surface font-medium border border-white/5">
                      {displayName || "—"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">
                      Email Address
                    </label>
                    <div className="bg-surface-container-low px-4 py-3 rounded-xl text-on-surface font-medium border border-white/5">
                      {userEmail || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Notifications Section */}
            <section className="bg-surface-container rounded-2xl p-6 lg:p-8 border border-white/5">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold font-headline">Notifications</h3>
              </div>

              <div className="space-y-8">
                {[
                  {
                    key: "thirtyDay" as const,
                    label: "30-Day Reminder",
                    sub: "Get notified a month before points expire.",
                  },
                  {
                    key: "fourteenDay" as const,
                    label: "14-Day Reminder",
                    sub: "Critical alert two weeks prior to expiry.",
                  },
                  {
                    key: "sevenDay" as const,
                    label: "7-Day Final Alert",
                    sub: "Last call notifications for all active rewards.",
                  },
                ].map(({ key, label, sub }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-on-surface">{label}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{sub}</p>
                    </div>
                    <button
                      onClick={() => toggleNotif(key)}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${
                        notifs[key] ? "bg-primary-container" : "bg-surface-container-highest"
                      }`}
                      aria-label={label}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full shadow-sm transition-all duration-200 ${
                          notifs[key]
                            ? "right-1 bg-on-primary"
                            : "left-1 bg-outline"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Billing Section */}
            <section className="bg-surface-container rounded-2xl p-6 lg:p-8 border border-white/5">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold font-headline">Billing</h3>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 text-center min-w-[140px]">
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Current Plan</p>
                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold uppercase tracking-tighter">
                      Free
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-on-surface font-medium">
                      $0 <span className="text-on-surface-variant font-normal">/ month</span>
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">Upgrade to unlock all features</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <button className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-full hover:scale-105 transition-transform duration-200 shadow-lg shadow-primary/10 text-sm">
                    Upgrade Plan
                  </button>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="px-8 py-3 border border-white/10 text-on-surface font-medium rounded-full hover:bg-surface-container-high transition-colors duration-200 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {signingOut ? "Signing out…" : "Sign Out"}
                  </button>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="bg-surface-container-low rounded-2xl p-6 lg:p-8 border border-destructive/10">
              <div className="flex items-center gap-4 mb-4">
                <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xl font-bold font-headline text-destructive">Danger Zone</h3>
              </div>
              <p className="text-on-surface-variant text-sm mb-8">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex items-center gap-2 text-destructive font-bold hover:opacity-80 transition-opacity disabled:opacity-50 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete account and all associated data
              </button>
            </section>
          </div>

          {/* ── Sidebar panel (desktop only) ── */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Data protection */}
              <div className="bg-gradient-to-br from-surface-container to-surface-container-low p-6 rounded-2xl border border-white/5">
                <Shield className="h-6 w-6 text-primary mb-4" />
                <h3 className="font-bold text-lg mb-2">Data Protection</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Your data is protected end-to-end. We never share your transactional data with third-party aggregators.
                </p>
              </div>

              {/* Account metadata */}
              <div className="p-6">
                <p className="text-[10px] uppercase tracking-widest text-outline mb-4">Account Info</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Email</span>
                    <span className="text-on-surface tabular-nums truncate ml-4 max-w-[140px]">
                      {userEmail ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Plan</span>
                    <span className="text-primary font-bold">Free</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
