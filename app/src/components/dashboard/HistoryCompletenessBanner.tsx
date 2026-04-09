"use client"
import { useState, useEffect } from "react"
import type { HistoryCompleteness } from "@/lib/history-completeness"
import Link from "next/link"

const DISMISS_KEY = "rr_history_banner_dismissed_v1"

interface Props {
  completeness: HistoryCompleteness
}

export function HistoryCompletenessBanner({ completeness }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (completeness.level !== "empty" && completeness.level !== "sparse") return
    const raw = localStorage.getItem(DISMISS_KEY)
    if (raw) {
      const expiry = new Date(raw)
      if (new Date() < expiry) return
    }
    setVisible(true)
  }, [completeness.level])

  if (!visible) return null

  const dismiss = () => {
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 14)
    localStorage.setItem(DISMISS_KEY, expiry.toISOString())
    setVisible(false)
  }

  const message = completeness.level === "empty"
    ? "Your recommendations are based on no card history. Add past cards to see which banks you are in a cooling-off period for."
    : `Your recommendations are based on ${completeness.cardCount} card${completeness.cardCount === 1 ? "" : "s"}. Add more past cards to improve accuracy.`

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
      <p className="flex-1 text-sm text-amber-300">
        {message}{" "}
        <Link href="/cards/history" className="text-amber-400 underline">Add card history</Link>
      </p>
      <button onClick={dismiss} className="text-amber-400/60 hover:text-amber-400 text-lg leading-none mt-0.5">×</button>
    </div>
  )
}
