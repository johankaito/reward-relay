"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Reset link missing or expired. Request again.")
        router.replace("/reset-password")
        return
      }
      setLoading(false)
    }
    checkSession()
  }, [router])

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setIsUpdating(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message || "Failed to update password")
      setIsUpdating(false)
      return
    }
    toast.success("Password updated. You are now signed in.")
    router.replace("/dashboard")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)] px-4 text-white">
        <Card className="w-full max-w-md border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
          <CardContent className="py-8 text-center text-sm text-slate-300">
            Checking reset link...
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)] px-4 text-white">
      <Card className="w-full max-w-md border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
        <CardHeader className="space-y-2">
          <p className="text-sm text-slate-300">Reward Relay</p>
          <CardTitle className="text-2xl font-semibold text-white">Set a new password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                New password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-200">
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                className="border-[var(--border-default)] bg-[var(--surface-soft)] text-white placeholder:text-slate-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full text-white"
              style={{ background: "var(--gradient-cta)" }}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
