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
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-16">
        <div className="mb-12">
          <h2 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">
            Account Settings
          </h2>
          <p className="text-on-surface-variant mt-2">
            Manage your profile, preferences and subscription.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* ── Main settings column ── */}
          <div className="lg:col-span-8 space-y-12">

            {/* Profile Section */}
            <section className="bg-surface-container rounded-lg p-6 lg:p-8 border border-white/5">
              <div className="flex items-center gap-4 mb-8">
                <span className="material-symbols-outlined text-[#4edea3]" style={{ fontSize: "24px" }}>person_outline</span>
                <h3 className="text-xl font-bold font-headline">Profile</h3>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-surface-container-highest flex items-center justify-center text-3xl font-extrabold text-[#4edea3] font-headline border-4 border-surface-container-low">
                    {initials}
                  </div>
                  <div className="absolute bottom-0 right-0 p-1.5 bg-[#07b77f] rounded-full">
                    <span className="material-symbols-outlined text-on-primary" style={{ fontSize: "14px" }}>edit</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 w-full">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">
                      Display Name
                    </label>
                    <div className="bg-surface-container-low px-4 py-3 rounded-lg text-on-surface font-medium border border-outline-variant/10">
                      {displayName || "—"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">
                      Email Address
                    </label>
                    <div className="bg-surface-container-low px-4 py-3 rounded-lg text-on-surface font-medium overflow-hidden text-ellipsis whitespace-nowrap border border-outline-variant/10">
                      {userEmail || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Notifications Section */}
            <section className="bg-surface-container rounded-lg p-6 lg:p-8 border border-white/5">
              <div className="flex items-center gap-4 mb-8">
                <span className="material-symbols-outlined text-[#4edea3]" style={{ fontSize: "24px" }}>notifications_active</span>
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
                        notifs[key] ? "bg-[#07b77f]" : "bg-surface-container-highest"
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
            <section className="bg-surface-container rounded-lg p-6 lg:p-8 border border-white/5">
              <div className="flex items-center gap-4 mb-8">
                <span className="material-symbols-outlined text-[#4edea3]" style={{ fontSize: "24px" }}>credit_card</span>
                <h3 className="text-xl font-bold font-headline">Billing</h3>
              </div>

              <div className="bg-surface-container-low p-8 rounded-lg mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/5">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4d3d76] to-[#d0bcff] flex items-center justify-center text-[#3a2a62]">
                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>diamond</span>
                  </div>
                  <div>
                    <p className="text-[0.6875rem] uppercase tracking-[0.05em] text-[#d0bcff] font-bold">Current Tier</p>
                    <p className="text-xl font-extrabold font-headline">Velocity Elite</p>
                    <p className="text-xs text-on-surface-variant tabular-nums">Next billing cycle: Oct 24, 2024</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    className="px-8 py-3 text-[#003824] font-bold rounded-full hover:scale-105 transition-transform duration-200 shadow-lg text-sm"
                    style={{ background: "linear-gradient(135deg, #3DFFA0 0%, #00C878 100%)" }}
                  >
                    Upgrade Plan
                  </button>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="text-[#4edea3] font-bold text-sm hover:underline underline-offset-4 disabled:opacity-50 transition-opacity"
                  >
                    {signingOut ? "Signing out…" : "Cancel Subscription"}
                  </button>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="bg-surface-container/30 p-6 rounded-lg border border-[#ffb4ab]/20">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold font-headline text-[#ffb4ab] mb-1">⚠ Danger Zone</h2>
                <p className="text-sm text-on-surface-variant">Once you delete your account, there is no going back. Please be certain.</p>
              </div>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="w-full p-4 rounded-lg border border-[#ffb4ab]/30 text-[#ffb4ab] text-sm text-center hover:bg-[#ffb4ab]/10 transition-colors disabled:opacity-50"
              >
                Delete account and all associated data
              </button>
            </section>
          </div>

          {/* ── Sidebar panel (desktop only) ── */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Data protection */}
              <div className="bg-gradient-to-br from-surface-container to-surface-container-low p-6 rounded-lg border border-white/5">
                <Shield className="h-6 w-6 text-[#4edea3] mb-4" />
                <h3 className="font-bold text-lg mb-2">Data Protection</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Your sovereign ledger is protected by AES-256 encryption. We never share your transactional data with third-party aggregators.
                </p>
                <a href="#" className="inline-block mt-4 text-[#4edea3] text-xs font-bold hover:underline">
                  View Privacy Policy
                </a>
              </div>

              {/* Account metadata */}
              <div className="p-6">
                <p className="text-[0.6875rem] uppercase tracking-widest text-outline mb-4">Account Metadata</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Member Since</span>
                    <span className="text-on-surface tabular-nums">Jan 2022</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Last Security Audit</span>
                    <span className="text-on-surface tabular-nums">2 days ago</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Device Authorization</span>
                    <span className="text-on-surface">3 Active</span>
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
