"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase/client"
import { useAnalytics } from "@/contexts/AnalyticsContext"
import { FEATURE_FLAGS } from "@/config/features"

export default function SignupPage() {
  const router = useRouter()
  const analytics = useAnalytics()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Redirect to home if in private beta mode
  useEffect(() => {
    if (FEATURE_FLAGS.privateBeta) {
      toast.info("Sign up is currently unavailable. Request beta access on our homepage!")
      router.push("/")
    }
  }, [router])

  // Track signup_started event when page loads
  useEffect(() => {
    const { source, campaign, medium } = analytics.getAcquisitionSource()
    analytics.trackEvent("signup_started", {
      source,
      campaign,
      medium,
    })
  }, [analytics])

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email || !password) {
      toast.error("Email and password are required")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      const { source, campaign, medium, cac_estimate } = analytics.getAcquisitionSource()
      analytics.trackEvent("signup_completed", {
        source,
        campaign,
        medium,
        cac_estimate,
      })

      toast.success("Account created! Check your email to confirm your account.", {
        duration: Infinity,
      })
      setEmail("")
      setPassword("")
      setConfirmPassword("")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign up failed. Try again."
      toast.error(message)
    } finally {
      setIsLoading(false)
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
      <div className="pointer-events-none fixed -top-24 -left-24 w-[500px] h-[500px] rounded-full blur-[120px] z-0 hidden md:block"
        style={{ background: "rgba(78,222,163,0.20)" }} />
      <div className="pointer-events-none fixed -bottom-24 -right-24 w-[500px] h-[500px] rounded-full blur-[120px] z-0 hidden md:block"
        style={{ background: "rgba(208,188,255,0.05)" }} />

      <div className="relative z-10 w-full max-w-[360px] md:max-w-md md:px-6">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-10">
          {/* Mobile: rocket icon */}
          <div className="text-[#4edea3] mb-3 md:hidden">
            <span className="material-symbols-outlined" style={{ fontSize: "48px", fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>rocket_launch</span>
          </div>
          {/* Desktop: R lettermark */}
          <div className="hidden md:block mb-4">
            <span className="font-headline text-4xl font-extrabold text-[#4edea3] tracking-tighter">R</span>
          </div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tighter text-center text-on-surface">
            Reward Relay
          </h1>
          {/* Mobile subtitle */}
          <p className="text-on-surface-variant mt-1 text-sm tracking-wide md:hidden">
            The Sovereign Ledger for Premium Rewards
          </p>
          {/* Desktop subtitle */}
          <p className="text-on-surface-variant mt-2 text-sm font-medium hidden md:block">
            Join the Sovereign Ledger
          </p>
        </div>

        {/* Glass card */}
        <div className="rounded-lg p-8 shadow-[0px_24px_48px_-12px_rgba(0,0,0,0.4)]"
          style={{ background: "rgba(20, 25, 40, 0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(68,71,85,0.15)" }}>

          {/* Mobile: heading + badge side by side */}
          <div className="flex justify-between items-start mb-8 md:hidden">
            <div>
              <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Create Account</h2>
              <p className="text-on-surface-variant text-sm">Join the elite network of value seekers.</p>
            </div>
            <div className="bg-[#4edea3]/10 border border-[#4edea3]/20 px-3 py-1.5 rounded-full flex-shrink-0 ml-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#4edea3] whitespace-nowrap">Private Beta — Invite Only</span>
            </div>
          </div>

          {/* Desktop: centered badge only */}
          <div className="hidden md:flex justify-center mb-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/20">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#4edea3]">Private Beta — Invite Only</span>
            </div>
          </div>

          <form onSubmit={handleSignup} name="signup" className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[10px] uppercase tracking-wider font-bold text-on-surface-variant px-1"
              >
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: "20px" }}>mail</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@domain.com"
                  className="w-full bg-surface-container md:bg-surface-container-highest/50 border-none rounded pl-12 pr-4 py-4 md:h-12 md:py-0 text-on-surface placeholder:text-outline md:placeholder:text-outline/50 focus:outline-none focus:ring-2 md:focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-[10px] uppercase tracking-wider font-bold text-on-surface-variant px-1"
              >
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: "20px" }}>lock</span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-surface-container md:bg-surface-container-highest/50 border-none rounded pl-12 pr-12 py-4 md:h-12 md:py-0 text-on-surface placeholder:text-outline md:placeholder:text-outline/50 focus:outline-none focus:ring-2 md:focus:ring-1 focus:ring-primary/30 transition-all"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline cursor-pointer hover:text-on-surface" style={{ fontSize: "20px" }}>visibility</span>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <label
                htmlFor="confirm-password"
                className="block text-[10px] uppercase tracking-wider font-bold text-on-surface-variant px-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: "20px" }}>verified_user</span>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-surface-container md:bg-surface-container-highest/50 border-none rounded pl-12 pr-4 py-4 md:h-12 md:py-0 text-on-surface placeholder:text-outline md:placeholder:text-outline/50 focus:outline-none focus:ring-2 md:focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={isLoading || !email || !password || !confirmPassword}
              className="w-full mt-4 h-14 font-headline font-bold rounded-full hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/20"
              style={{ background: "linear-gradient(135deg, #4EDEA3 0%, #10B981 100%)", color: "#002919" }}
            >
              {isLoading ? "Creating account…" : "Create account"}
              {!isLoading && (
                <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1" style={{ fontSize: "18px" }}>arrow_forward</span>
              )}
            </button>

            {/* Terms */}
            <p className="text-center text-[11px] text-on-surface-variant leading-relaxed mt-6 px-4">
              By clicking &ldquo;Create account&rdquo;, you agree to our{" "}
              <Link href="/terms" className="text-[#4edea3] hover:underline underline-offset-2">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#4edea3] hover:underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </form>

        </div>

        {/* Secondary action — outside card */}
        <div className="mt-10 text-center">
          <p className="text-on-surface-variant text-sm">
            Already have an account?{" "}
            {/* Desktop: "Log in" per design; Mobile: "Sign In" */}
            <Link href="/login" className="text-[#4edea3] font-bold ml-1 hover:underline underline-offset-4 hidden md:inline">
              Log in
            </Link>
            <Link href="/login" className="text-[#4edea3] font-bold ml-1 hover:underline underline-offset-4 md:hidden">
              Sign In
            </Link>
          </p>
        </div>

        {/* Mobile footer */}
        <div className="mt-12 text-center text-[10px] text-outline uppercase tracking-widest font-medium md:hidden">
          © 2024 Reward Relay • Secure Sovereign Ledger • All Rights Reserved
        </div>

        {/* Desktop decorative footer */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 opacity-20 pointer-events-none">
          <div className="h-px w-24 bg-outline-variant" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant whitespace-nowrap">Sovereign Financial Protocol v1.4</span>
          <div className="h-px w-24 bg-outline-variant" />
        </div>
      </div>
    </>
  )
}
