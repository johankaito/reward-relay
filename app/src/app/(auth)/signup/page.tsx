"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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
      })

      if (error) throw error

      toast.success("Account created. Check your email for confirmation.")
      router.push("/dashboard")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign up failed. Try again."
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)] px-4 text-white">
      <Card className="w-full max-w-md border border-[var(--border-default)] bg-[var(--surface)] shadow-xl">
        <CardHeader className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Reward Relay
          </p>
          <CardTitle className="text-2xl font-semibold text-white">
            Create your account
          </CardTitle>
          <p className="text-sm text-slate-300">Week 1: add your AMEX + churn target</p>
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
    </div>
  )
}
