"use client"

interface OnboardingGateProps {
  onSelect: (hasChurned: boolean) => void
}

export function OnboardingGate({ onSelect }: OnboardingGateProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface-muted)] px-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white">
            Welcome to Reward Relay
          </h1>
          <p className="text-lg text-on-surface-variant">
            Let&apos;s find your next card. Quick question to get started.
          </p>
        </div>

        <p className="text-xl font-medium text-white">
          Have you applied for a credit card to earn points before?
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => onSelect(true)}
            className="group rounded-2xl border-2 border-white/10 bg-white/5 p-8 text-left transition-all hover:scale-[1.02] hover:border-teal-500/50 hover:bg-teal-500/5"
          >
            <div className="text-4xl">✅</div>
            <h3 className="mt-4 text-xl font-semibold text-white">
              Yes, I&apos;ve churned before
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              I&apos;ve applied for cards and earned welcome bonuses
            </p>
          </button>

          <button
            onClick={() => onSelect(false)}
            className="group rounded-2xl border-2 border-white/10 bg-white/5 p-8 text-left transition-all hover:scale-[1.02] hover:border-teal-500/50 hover:bg-teal-500/5"
          >
            <div className="text-4xl">🚀</div>
            <h3 className="mt-4 text-xl font-semibold text-white">
              No, I&apos;m new to this
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              I want to start earning points for flights and travel
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
