"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"
import { useAnalytics } from "@/contexts/AnalyticsContext"
import { FEATURE_FLAGS } from "@/config/features"

export default function SignupPage() {
  const router = useRouter()
  const analytics = useAnalytics()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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

      // Track signup completion
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
      // Don't redirect yet - user needs to confirm email first
      setEmail("")
      setPassword("")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign up failed. Try again."
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <Card className="w-full max-w-md mx-auto border border-[var(--border-default)] bg-[var(--surface)] shadow-xl">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-semibold text-white">
            Create your account
          </CardTitle>
          <p className="text-sm text-slate-300">Week 1: add your cards + churn target</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSignup} className="space-y-4" name="signup">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
                className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="At least 6 characters"
                className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white placeholder:text-slate-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full text-white"
              style={{ background: "var(--gradient-cta)" }}
              disabled={isLoading || !email || !password}
            >
              {isLoading ? "Creating..." : "Create account"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-slate-300">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--accent-strong)] underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
  )
}
