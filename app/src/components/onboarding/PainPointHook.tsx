"use client"

interface PainPointHookProps {
  onContinue: () => void
  onSkip: () => void
}

export function PainPointHook({ onContinue, onSkip }: PainPointHookProps) {
  return (
    <div className="flex min-h-screen bg-[var(--surface)]">
      {/* Mobile / single column */}
      <div className="flex flex-col w-full lg:w-3/5 px-6 py-10 justify-center max-w-2xl mx-auto lg:mx-0 lg:pl-20">
        <div className="mb-6" />

        {/* Headline */}
        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
          Most Australians leave{" "}
          <span className="text-primary">$1,200+</span> in rewards unclaimed each year.
        </h1>

        <p className="mt-4 text-lg text-white/60">
          In 3 steps, we&apos;ll show you exactly what you&apos;re missing.
        </p>

        {/* Progress steps */}
        <div className="mt-8 flex items-center gap-2 text-xs uppercase tracking-widest text-white/40">
          <span className="text-primary font-semibold">Add cards</span>
          <span className="h-px w-6 bg-white/20" />
          <span>Get spending</span>
          <span className="h-px w-6 bg-white/20" />
          <span>See your gap</span>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex items-center gap-4">
          <button
            onClick={onContinue}
            className="rounded-full px-8 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--gradient-cta, linear-gradient(135deg, #10B981, #059669))" }}
          >
            Let&apos;s go →
          </button>
          <button
            onClick={onSkip}
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            Skip for now
          </button>
        </div>

        {/* Mobile locked gap preview */}
        <div className="mt-10 lg:hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <span className="text-lg">🔒</span>
          </div>
          <p className="font-medium text-white">Your personalised gap</p>
          <p className="text-sm text-white/50">Ready to be revealed</p>
        </div>
      </div>

      {/* Desktop right panel — locked gap preview */}
      <div className="hidden lg:flex lg:w-2/5 items-center justify-center px-10">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <span className="text-2xl">🔒</span>
          </div>
          <p className="text-lg font-semibold text-white">Your personalised gap</p>
          <p className="mt-1 text-sm text-white/50">Ready to be revealed once your profile is complete.</p>
          <div className="mt-6 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
            <p className="text-xs text-primary uppercase tracking-wider">Avg. gap unlocked</p>
            <p className="mt-1 text-2xl font-bold text-white">$2,393<span className="text-base font-normal text-white/60">/yr</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
