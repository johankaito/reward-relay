"use client"

import { Wifi } from "lucide-react"
import { getBankGradient } from "@/lib/bank-gradients"
import type { Database } from "@/types/database.types"

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]

type Props = {
  card: UserCard
  showProgress?: boolean
  onClick?: () => void
}

export function WalletCard({ card, showProgress = false, onClick }: Props) {
  const gradient = getBankGradient(card.bank)
  const isLight = card.bank === "CommBank"

  const textColor = isLight ? "text-black/80" : "text-white"
  const textMuted = isLight ? "text-black/50" : "text-white/60"

  const progressPct =
    showProgress && card.current_spend != null && card.annual_fee != null && card.annual_fee > 0
      ? Math.min(100, Math.round((card.current_spend / card.annual_fee) * 100))
      : null

  const daysLeft = (() => {
    if (!card.bonus_spend_deadline) return null
    const diff = new Date(card.bonus_spend_deadline).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / 86_400_000))
  })()

  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
    >
      {/* Card face */}
      <div
        className="relative aspect-[1.586/1] w-full rounded-xl p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg overflow-hidden"
        style={{ background: gradient }}
      >
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-white/5 mix-blend-overlay" />

        {/* Top row */}
        <div className={`flex justify-between items-start relative z-10 ${textColor}`}>
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-80">
            {card.bank ?? "Card"}
          </span>
          <Wifi className="h-4 w-4 opacity-40 rotate-90" />
        </div>

        {/* Card name bottom */}
        <div className="relative z-10">
          <p className={`text-sm font-headline font-bold tracking-wide ${textColor}`}>
            {card.name ?? "Untitled Card"}
          </p>
          {daysLeft !== null && (
            <p className={`text-[10px] mt-0.5 ${textMuted}`}>
              {daysLeft}d left on bonus
            </p>
          )}
        </div>
      </div>

      {/* Progress bar below card (compact) */}
      {showProgress && progressPct !== null && (
        <div className="mt-3 px-1 space-y-1">
          <div className="flex justify-between text-[10px] font-medium text-slate-400">
            <span>Spend progress</span>
            <span className="tabular-nums text-[#4edea3]">{progressPct}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-[#313442] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #10b981 0%, #4edea3 100%)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
