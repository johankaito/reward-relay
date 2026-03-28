"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import type { FormEvent } from "react"

import { supabase } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showBetaForm, setShowBetaForm] = useState(false)
  const [betaEmail, setBetaEmail] = useState("")
  const [betaName, setBetaName] = useState("")
  const [betaLoading, setBetaLoading] = useState(false)

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    if (!email || !password) {
      toast.error("Email and password are required")
      return
    }
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push("/dashboard")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Login failed. Try again."
      toast.error(message)
      setIsLoading(false)
    }
  }

  const handleBetaRequest = async (e: FormEvent) => {
    e.preventDefault()

    if (!betaEmail || !betaEmail.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    setBetaLoading(true)

    try {
      const { error } = await supabase.from("beta_requests").insert({
        email: betaEmail.trim(),
        name: betaName.trim() || null,
      })

      if (error) throw error

      toast.success("Request submitted! We'll be in touch soon.")
      setShowBetaForm(false)
      setBetaEmail("")
      setBetaName("")
    } catch (error: unknown) {
      console.error("Beta request error:", error)
      toast.error((error as Error).message || "Failed to submit request. Please try again.")
    } finally {
      setBetaLoading(false)
    }
  }

  return (
    <>
      {/* Ambient glow blobs — mobile: subtle radial, desktop: solid circle blur */}
      <div
        className="pointer-events-none fixed top-[-10%] left-[-10%] w-[60%] h-[60%] z-0 md:hidden"
        style={{ background: "radial-gradient(circle at center, rgba(101,243,182,0.08) 0%, rgba(10,14,26,0) 70%)" }}
      />
      <div
        className="pointer-events-none fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] z-0 md:hidden"
        style={{ background: "radial-gradient(circle at center, rgba(208,188,255,0.05) 0%, rgba(10,14,26,0) 70%)" }}
      />
      <div className="pointer-events-none fixed -top-24 -left-24 w-[700px] h-[700px] rounded-full blur-[180px] z-0 hidden md:block"
        style={{ background: "rgba(78,222,163,0.10)" }} />
      <div className="pointer-events-none fixed -bottom-24 -right-24 w-[700px] h-[700px] rounded-full blur-[180px] z-0 hidden md:block"
        style={{ background: "rgba(208,188,255,0.04)" }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Decorative circles */}
        <div className="absolute inset-0 z-[-1] opacity-20 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-32 h-32 border border-outline-variant/30 rounded-full" />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 border border-outline-variant/20 rounded-full" />
        </div>

        {/* Glass card */}
        <div className="glass-card rounded-[2rem] px-10 pt-10 pb-8 shadow-[0px_24px_48px_-12px_rgba(0,0,0,0.4)]"
          style={{ border: "1px solid rgba(68, 71, 85, 0.15)" }}>

          {/* Brand section */}
          <div className="mb-10 text-center">
            {/* Desktop: bolt icon in rounded-xl box */}
            <div className="hidden md:inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: "rgba(32,37,55,1)", border: "1px solid rgba(68,71,85,0.15)" }}>
              <span className="material-symbols-outlined text-[#4edea3] text-3xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>bolt</span>
            </div>
            {/* Title: green on mobile, white on desktop */}
            <h1 className="font-headline text-3xl font-extrabold tracking-tighter text-on-surface">
              <span className="md:hidden text-[#65f3b6]">Reward Relay</span>
              <span className="hidden md:inline">Reward Relay</span>
            </h1>
            {/* Subtitle: different per breakpoint */}
            <p className="text-on-surface-variant text-sm font-medium mt-1 tracking-wide">
              <span className="md:hidden">Elevate your wealth. Velocity &apos;R&apos; Monogram.</span>
              <span className="hidden md:inline">The Sovereign Ledger of Prestige</span>
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} name="login" className={`space-y-6${showBetaForm ? " hidden" : ""}`}>
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[10px] uppercase tracking-[0.05em] font-bold text-on-surface-variant px-1"
              >
                Email Address
              </label>
              <div className="relative group">
                {/* Mobile only: mail icon */}
                <div className="md:hidden absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>mail</span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@luxury.com"
                  className="w-full h-14 bg-surface-container-highest border-none rounded-2xl md:rounded-lg pl-12 md:pl-5 pr-4 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-[#4edea3]/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              {/* Desktop: label + forgot password inline */}
              <div className="flex justify-between items-center px-1">
                <label
                  htmlFor="password"
                  className="block text-[10px] uppercase tracking-[0.05em] font-bold text-on-surface-variant"
                >
                  Password
                </label>
                {/* Desktop only: forgot password beside label */}
                <Link
                  href="/reset-password"
                  className="hidden md:block text-[10px] uppercase tracking-[0.05em] font-bold text-on-surface-variant hover:text-[#4edea3] transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                {/* Mobile only: lock icon */}
                <div className="md:hidden absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>lock</span>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-14 bg-surface-container-highest border-none rounded-2xl md:rounded-lg pl-12 md:pl-5 pr-4 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-[#4edea3]/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Mobile only: Keep signed in + Forgot password row */}
            <div className="md:hidden flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="rounded-sm border-none bg-surface-container-highest text-[#4edea3] focus:ring-[#4edea3]/20 transition-all"
                />
                <span className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">Keep me signed in</span>
              </label>
              <Link
                href="/reset-password"
                className="text-xs text-on-surface-variant hover:text-[#4edea3] transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full h-14 mt-4 font-headline font-extrabold rounded-full hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 group"
              style={{ background: "linear-gradient(135deg, #4EDEA3 0%, #10B981 100%)", color: "#00432c" }}
            >
              {isLoading ? "Signing in…" : (
                <>
                  Sign in
                  {/* Mobile only: arrow icon */}
                  <span className="md:hidden">
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={{ fontSize: "18px" }}>arrow_forward</span>
                  </span>
                </>
              )}
            </button>

            {/* Mobile only: Or continue with */}
            <div className="md:hidden mt-2 pt-6 border-t border-white/5">
              <p className="text-center text-xs text-on-surface-variant mb-6">Or continue with</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 bg-surface-container-high py-3 rounded-2xl hover:bg-surface-container-highest transition-colors group"
                >
                  <span className="material-symbols-outlined text-on-surface group-hover:text-[#4edea3] transition-colors" style={{ fontSize: "20px" }}>account_balance</span>
                  <span className="text-xs font-medium">Wallet</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 bg-surface-container-high py-3 rounded-2xl hover:bg-surface-container-highest transition-colors group"
                >
                  <span className="material-symbols-outlined text-on-surface group-hover:text-[#4edea3] transition-colors" style={{ fontSize: "20px" }}>fingerprint</span>
                  <span className="text-xs font-medium">Passkey</span>
                </button>
              </div>
            </div>
          </form>

          {/* Footer — sign up or beta request form */}
          {!showBetaForm ? (
            <div className="mt-8 text-center">
              <p className="text-on-surface-variant text-sm font-medium">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setShowBetaForm(true)}
                  className="text-[#4edea3] font-bold hover:underline underline-offset-4 ml-1"
                >
                  Sign up
                </button>
              </p>
            </div>
          ) : (
            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <p className="text-xs font-bold text-on-surface-variant text-center uppercase tracking-widest mb-4">
                Request Beta Access
              </p>
              <form onSubmit={handleBetaRequest} className="space-y-4">
                <input
                  type="email"
                  value={betaEmail}
                  onChange={(e) => setBetaEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full h-12 px-5 bg-surface-container-highest rounded-2xl border-none text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-[#4edea3]/20 transition-all"
                />
                <input
                  type="text"
                  value={betaName}
                  onChange={(e) => setBetaName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full h-12 px-5 bg-surface-container-highest rounded-2xl border-none text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-[#4edea3]/20 transition-all"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={betaLoading}
                    className="flex-1 h-12 text-black font-headline font-bold rounded-full hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-[#4edea3]/20"
                    style={{ background: "var(--gradient-cta)" }}
                  >
                    {betaLoading ? "Submitting…" : "Request Access"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBetaForm(false)
                      setBetaEmail("")
                      setBetaName("")
                    }}
                    className="px-5 h-12 rounded-full bg-surface-container-highest text-on-surface-variant font-medium text-sm hover:text-on-surface transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Desktop only: authorized access footer */}
        <footer className="hidden md:block fixed bottom-8 left-0 right-0 text-center pointer-events-none">
          <p className="font-headline text-[10px] uppercase tracking-[0.2em] text-outline-variant">Authorized Access Only</p>
        </footer>

      </div>
    </>
  )
}
