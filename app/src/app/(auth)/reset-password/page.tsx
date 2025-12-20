"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email) {
      toast.error("Email is required")
      return
    }
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      if (error) throw error
      toast.success("Check your email for a password reset link.")
      setEmail("")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Reset failed. Try again."
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)] px-4 text-white">
      <Card className="w-full max-w-md border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
        <CardHeader className="space-y-2">
          <p className="text-sm text-slate-300">Reward Relay</p>
          <CardTitle className="text-2xl font-semibold text-white">Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
                className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white placeholder:text-slate-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full text-white"
              style={{ background: "var(--gradient-cta)" }}
              disabled={isLoading || !email}
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
