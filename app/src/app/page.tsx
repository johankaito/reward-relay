export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-muted)] text-white">
      <main className="flex flex-1 items-center justify-center">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-12 md:grid-cols-[1.05fr_0.95fr] md:items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-teal-200 ring-1 ring-white/10">
                Australian churners · Private beta
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                  Turn every card into maximum rewards—automatically.
                </h1>
                <p className="text-base text-slate-200">
                  Track your cards, stay ahead of annual fees, and see which card to churn next. Built
                  for the way Australians actually churn.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[var(--accent-contrast)] shadow-lg shadow-teal-500/20 transition hover:translate-y-[-1px]"
                  style={{ background: "var(--gradient-accent)" }}
                >
                  Log in
                </a>
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Create account
                </a>
              </div>
              <p className="text-xs text-slate-300">
                Week 1 goal: sign up, add your 2 cards, and decide which to apply for next.
              </p>
            </div>

            <div className="w-full space-y-4 rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] p-6 shadow-xl">
              <p className="text-sm font-semibold text-white">Live preview</p>
              <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-muted)] text-white shadow-lg">
                <div
                  className="flex items-center justify-between rounded-t-2xl px-4 py-3 text-sm font-semibold text-[var(--accent-contrast)]"
                  style={{ background: "var(--gradient-accent)" }}
                >
                  Your next churn
                  <span className="rounded-full bg-white/30 px-3 py-1 text-xs text-[var(--accent-contrast)]">
                    Ready this month
                  </span>
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Recommended</p>
                      <p className="text-base font-semibold text-white">ANZ Rewards Black</p>
                    </div>
                    <span className="rounded-full bg-[var(--info-bg)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                      $1,200 net
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                    <div className="rounded-xl bg-[var(--surface)] p-3 ring-1 ring-[var(--border-default)]/60">
                      <p className="text-xs text-slate-400">Cancel by</p>
                      <p className="font-semibold text-white">Aug 14, 2025</p>
                    </div>
                    <div className="rounded-xl bg-[var(--surface)] p-3 ring-1 ring-[var(--border-default)]/60">
                      <p className="text-xs text-slate-400">Reapply</p>
                      <p className="font-semibold text-white">Feb 2026</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-soft)]/60 p-3 text-xs text-slate-200">
                    Stay under 3 active cards to avoid credit score swings. We'll remind you before any
                    annual fee hits.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border-default)] bg-[var(--surface)] py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-slate-400 md:flex-row">
            <p>© {new Date().getFullYear()} Reward Relay. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="/privacy" className="hover:text-white transition">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-white transition">
                Terms of Service
              </a>
              <a href="mailto:support@rewardrelay.au" className="hover:text-white transition">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
