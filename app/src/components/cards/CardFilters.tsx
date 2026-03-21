"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type CardFilterProps = {
  cards: Array<{ bank: string; name: string }>
  onFilter: (filters: { search: string; bank: string | null }) => void
}

export function CardFilters({ cards, onFilter }: CardFilterProps) {
  const [search, setSearch] = useState("")
  const [bank, setBank] = useState<string | null>(null)

  const banks = useMemo(
    () => Array.from(new Set(cards.map((c) => c.bank))).sort(),
    [cards],
  )

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-[#1b1f2c] p-4 text-white shadow-md md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Filters</p>
        <p className="text-sm text-slate-300">{cards.length} cards available</p>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          placeholder="Search by card or bank"
          value={search}
          onChange={(e) => {
            const value = e.target.value
            setSearch(value)
            onFilter({ search: value, bank })
          }}
          className="rounded-xl border-0 bg-[#313442] text-[#dfe2f3] placeholder:text-slate-500 focus-visible:bg-[#353946] focus-visible:ring-0 md:w-80"
        />
        <Select
          onValueChange={(value) => {
            const nextBank = value === "all" ? null : value
            setBank(nextBank)
            onFilter({ search, bank: nextBank })
          }}
          defaultValue="all"
        >
          <SelectTrigger className="w-full rounded-xl border-0 bg-[#313442] text-[#dfe2f3] focus:ring-0 md:w-48">
            <SelectValue placeholder="Filter by bank" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All banks</SelectItem>
            {banks.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
