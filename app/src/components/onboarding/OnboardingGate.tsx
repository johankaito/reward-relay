"use client"

import { useState } from "react"

interface OnboardingGateProps {
  onSelect: (hasChurned: boolean) => void
}

export function OnboardingGate({ onSelect }: OnboardingGateProps) {
  const [selected, setSelected] = useState<boolean | null>(null)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F131F] px-4 py-12">
      {/* Step indicator */}
      <div className="mb-8 w-full max-w-2xl">
        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/30">
          <span className="text-teal-400 font-semibold">Step 1 of 4</span>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`h-1 w-8 rounded-full ${i === 0 ? "bg-teal-400" : "bg-white/15"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Have you applied for a card to earn points before?
          </h1>
          <p className="text-white/60">This helps us personalise your first plan.</p>
        </div>

        {/* Selection cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              value: true,
              icon: "⚡",
              title: "Yes, I've done this before",
              sublabel: "I've applied for cards to earn points",
            },
            {
              value: false,
              icon: "⭐",
              title: "No, I'm new to this",
              sublabel: "I've never churned cards for rewards",
            },
          ].map((opt) => {
            const isSelected = selected === opt.value
            return (
              <button
                key={String(opt.value)}
                onClick={() => setSelected(opt.value)}
                className={`relative rounded-2xl border-2 p-8 text-left transition-all duration-200 hover:scale-[1.01] ${
                  isSelected
                    ? "border-teal-500 bg-teal-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                {isSelected && (
                  <div className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </div>
                )}
                <div className="text-3xl">{opt.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-white">{opt.title}</h3>
                <p className="mt-1 text-sm text-white/55">{opt.sublabel}</p>
              </button>
            )
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={() => selected !== null && onSelect(selected)}
          disabled={selected === null}
          className="w-full rounded-full py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ background: "var(--gradient-cta, linear-gradient(135deg, #10B981, #059669))" }}
        >
          Continue →
        </button>

        {/* Footnote */}
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-white/40">
            <span className="text-white/60 font-medium">Why do we ask this?</span>{" "}
            Experienced churners get access to complex multi-card sequences, while beginners start with high-approval, simple-value cards to protect their credit score.
          </p>
        </div>
      </div>
    </div>
  )
}
