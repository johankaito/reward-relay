"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Edit2, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"

interface PointsBalanceWidgetProps {
  currentBalance: number
  lastUpdated: Date | null
  onBalanceUpdate?: () => void
}

export function PointsBalanceWidget({
  currentBalance,
  lastUpdated,
  onBalanceUpdate,
}: PointsBalanceWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [balance, setBalance] = useState(currentBalance.toString())
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async () => {
    const newBalance = parseInt(balance, 10)

    if (isNaN(newBalance) || newBalance < 0) {
      toast.error("Please enter a valid points balance")
      return
    }

    setIsUpdating(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      toast.error("Please sign in to update your points balance")
      setIsUpdating(false)
      return
    }

    // Upsert user_points
    const { error } = await supabase
      .from("user_points")
      .upsert({
        user_id: session.user.id,
        qantas_ff_balance: newBalance,
        last_updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id"
      })

    setIsUpdating(false)

    if (error) {
      toast.error(error.message || "Failed to update points balance")
      return
    }

    toast.success("Points balance updated successfully")
    setIsOpen(false)

    if (onBalanceUpdate) {
      onBalanceUpdate()
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Never"
    return new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <>
      <Card className="border border-[var(--border-default)] bg-gradient-to-br from-[var(--surface)] to-[color-mix(in_srgb,var(--accent)_3%,transparent)] shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            Qantas FF Points
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-white">
                {currentBalance.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400">
                Updated {formatDate(lastUpdated)}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setBalance(currentBalance.toString())
                setIsOpen(true)
              }}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Points Balance</DialogTitle>
            <DialogDescription>
              Enter your current Qantas Frequent Flyer points balance. You can find
              this by logging into your Qantas account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Points Balance</Label>
              <Input
                id="balance"
                type="number"
                min="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="e.g., 50000"
              />
            </div>
            <p className="text-xs text-slate-400">
              💡 Tip: Check your Qantas account monthly to keep your projections
              accurate
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Balance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
