"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PublicHeader } from "@/components/layout/PublicHeader"
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

      // Keep loading state during navigation
      router.push("/dashboard")
      // Don't set isLoading false - keep it true during redirect
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
      <Card className="w-full max-w-md mx-auto border border-[var(--border-default)] bg-[var(--surface)] shadow-xl">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-semibold text-[var(--text-primary)]">
            Log in to your account
          </CardTitle>
          <p className="text-sm text-[var(--text-secondary)]">Australian credit card rewards tracker</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4" name="login">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--text-primary)]">
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
                className="border-[var(--border-default)] bg-[var(--surface-soft)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--text-primary)]">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="••••••••"
                className="border-[var(--border-default)] bg-[var(--surface-soft)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </form>
          {!showBetaForm ? (
            <>
              <div className="mt-4 text-center text-sm text-[var(--text-secondary)]">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setShowBetaForm(true)}
                  className="text-[var(--accent)] underline hover:text-[var(--accent-strong)] transition-colors"
                >
                  Request access
                </button>
              </div>
              <div className="mt-2 text-center text-sm text-[var(--text-secondary)]">
                <Link href="/reset-password" className="text-[var(--accent)] underline hover:text-[var(--accent-strong)] transition-colors">
                  Forgot password?
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-6 pt-6 border-t border-[var(--border-default)]">
              <form onSubmit={handleBetaRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="beta-email" className="text-[var(--text-primary)]">
                    Email
                  </Label>
                  <Input
                    id="beta-email"
                    type="email"
                    value={betaEmail}
                    onChange={(e) => setBetaEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="border-[var(--border-default)] bg-[var(--surface-soft)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beta-name" className="text-[var(--text-primary)]">
                    Name (optional)
                  </Label>
                  <Input
                    id="beta-name"
                    type="text"
                    value={betaName}
                    onChange={(e) => setBetaName(e.target.value)}
                    placeholder="Your name"
                    className="border-[var(--border-default)] bg-[var(--surface-soft)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={betaLoading}
                    className="flex-1"
                  >
                    {betaLoading ? "Submitting..." : "Request Access"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowBetaForm(false)
                      setBetaEmail("")
                      setBetaName("")
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
  )
}
