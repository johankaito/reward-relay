"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Mail, Lock, ShieldCheck, ArrowRight } from "lucide-react"

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
      {/* Ambient glow blobs */}
      <div
        className="pointer-events-none fixed -top-24 -left-24 w-[500px] h-[500px] rounded-full blur-[120px] z-0"
        style={{ background: "rgba(101,243,182,0.08)" }}
      />
      <div
        className="pointer-events-none fixed -bottom-24 -right-24 w-[500px] h-[500px] rounded-full blur-[120px] z-0"
        style={{ background: "rgba(208,188,255,0.05)" }}
      />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-10">
          <div className="mb-4">
            <span className="text-4xl font-extrabold text-primary tracking-tighter font-headline">R</span>
          </div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-center text-on-surface">
            Reward Relay
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm font-medium">
            Join the Sovereign Ledger
          </p>
        </div>

        {/* Glass card */}
        <div className="glass-card rounded-2xl p-8 md:p-10 shadow-[0px_24px_48px_-12px_rgba(0,0,0,0.4)] border border-white/10">
          {/* Beta badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Private Beta — Invite Only
              </span>
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
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="w-full h-12 pl-12 pr-4 bg-surface-container-highest/50 border-none rounded-2xl text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
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
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-12 pl-12 pr-4 bg-surface-container-highest/50 border-none rounded-2xl text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
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
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline pointer-events-none" />
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-12 pl-12 pr-4 bg-surface-container-highest/50 border-none rounded-2xl text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={isLoading || !email || !password || !confirmPassword}
              className="w-full h-14 mt-4 text-black font-headline font-bold rounded-full hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/20"
              style={{ background: "var(--gradient-cta)" }}
            >
              {isLoading ? "Creating account…" : "Create account"}
              {!isLoading && (
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>

            {/* Terms */}
            <p className="text-center text-[11px] text-on-surface-variant leading-relaxed mt-6 px-4">
              By clicking Create account, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline underline-offset-2">
                Terms of Service
              </Link>{" "}
              and acknowledge our{" "}
              <Link href="/privacy" className="text-primary hover:underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </form>

          <div className="mt-8 pt-8 border-t border-outline-variant/15 flex flex-col items-center">
            <p className="text-on-surface-variant text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold ml-1 hover:underline underline-offset-4">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom branding */}
        <div className="mt-12 text-center text-[10px] text-outline uppercase tracking-widest font-medium">
          © 2024 Reward Relay • Secure Sovereign Ledger • All Rights Reserved
        </div>
      </div>
    </>
  )
}
