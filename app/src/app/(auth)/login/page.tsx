"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Mail, Lock, ArrowRight, Zap } from "lucide-react"

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

  const handleLogin = async (event: React.FormEvent) => {
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

  const handleBetaRequest = async (e: React.FormEvent) => {
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
      {/* Ambient glow blobs */}
      <div
        className="pointer-events-none fixed top-[-10%] left-[-10%] w-[60%] h-[60%] z-0"
        style={{ background: "radial-gradient(circle, rgba(78,222,163,0.15) 0%, rgba(78,222,163,0) 70%)" }}
      />
      <div
        className="pointer-events-none fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] z-0"
        style={{ background: "radial-gradient(circle, rgba(208,188,255,0.10) 0%, rgba(208,188,255,0) 70%)" }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Glass card */}
        <div className="glass-card rounded-2xl p-10 shadow-[0px_24px_48px_-12px_rgba(0,0,0,0.4)] border border-white/10">

          {/* Brand section */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-surface-container-highest border border-outline-variant/15 mb-4">
              <Zap className="h-7 w-7 text-primary fill-primary" />
            </div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tighter text-on-surface">
              Reward Relay
            </h1>
            <p className="text-on-surface-variant text-sm font-medium mt-1 tracking-wide">
              The Sovereign Ledger of Prestige
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} name="login" className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[10px] uppercase tracking-[0.05em] font-bold text-on-surface-variant px-1"
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
                  placeholder="name@luxury.com"
                  className="w-full h-14 pl-12 pr-5 bg-surface-container-highest rounded-2xl border-none text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label
                  htmlFor="password"
                  className="block text-[10px] uppercase tracking-[0.05em] font-bold text-on-surface-variant"
                >
                  Password
                </label>
                <Link
                  href="/reset-password"
                  className="text-[10px] uppercase tracking-[0.05em] font-bold text-on-surface-variant hover:text-primary transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-5 bg-surface-container-highest rounded-2xl border-none text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full h-14 mt-4 text-black font-headline font-extrabold rounded-full hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
              style={{ background: "var(--gradient-cta)" }}
            >
              {isLoading ? "Signing in…" : "Sign in"}
              {!isLoading && (
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          {/* Footer — sign up or beta request form */}
          {!showBetaForm ? (
            <div className="mt-8 text-center">
              <p className="text-on-surface-variant text-sm font-medium">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setShowBetaForm(true)}
                  className="text-primary font-bold hover:underline underline-offset-4 ml-1"
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
                  className="w-full h-12 px-5 bg-surface-container-highest rounded-2xl border-none text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <input
                  type="text"
                  value={betaName}
                  onChange={(e) => setBetaName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full h-12 px-5 bg-surface-container-highest rounded-2xl border-none text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={betaLoading}
                    className="flex-1 h-12 text-black font-headline font-bold rounded-full hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
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

        {/* Footer identity anchor */}
        <p className="mt-8 text-center font-headline text-[10px] uppercase tracking-[0.2em] text-outline-variant">
          Authorized Access Only
        </p>
      </div>
    </>
  )
}
