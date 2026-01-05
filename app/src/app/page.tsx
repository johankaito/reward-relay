"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabase/client"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in and redirect to dashboard
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace("/dashboard")
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#050810] text-white">
      {/* Subtle gradient orbs for depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"></div>
      </div>

      <main className="relative z-10 flex flex-1 items-center justify-center py-8 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12 xl:gap-16">
            {/* Left: Hero Content */}
            <div className="flex flex-col justify-center space-y-8">
              <div className="flex items-center gap-3">
                <Image src="/logo.svg" alt="Reward Relay" width={40} height={40} className="drop-shadow-lg" />
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-teal-200 backdrop-blur-sm">
                  Australian churners · Private beta
                </span>
              </div>

              <div className="space-y-6">
                <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Turn every card into maximum rewards—
                  <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    automatically
                  </span>
                </h1>
                <p className="text-lg text-slate-300 sm:text-xl">
                  Track your cards, stay ahead of annual fees, and see which card to churn next. Built
                  for the way Australians actually churn.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="/login"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-teal-500/30"
                >
                  Log in
                </a>
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10"
                >
                  Create account
                </a>
              </div>

              <p className="text-sm text-slate-400">
                Week 1 goal: sign up, add your 2 cards, and decide which to apply for next.
              </p>
            </div>

            {/* Right: Dashboard Preview */}
            <div className="relative">
              <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Dashboard preview</p>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-800/90 shadow-2xl backdrop-blur-sm">
                  <div className="flex items-center justify-between bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3">
                    <span className="text-sm font-semibold text-white">Your next churn</span>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      Ready this month
                    </span>
                  </div>
                  <div className="space-y-4 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-400">Recommended</p>
                        <p className="text-lg font-bold text-white">ANZ Rewards Black</p>
                      </div>
                      <span className="rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 px-3 py-1.5 text-sm font-bold text-teal-300 ring-1 ring-teal-400/30">
                        $1,200 net
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                        <p className="text-xs font-medium text-slate-400">Cancel by</p>
                        <p className="mt-1 text-sm font-semibold text-white">Aug 14, 2025</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                        <p className="text-xs font-medium text-slate-400">Reapply</p>
                        <p className="mt-1 text-sm font-semibold text-white">Feb 2026</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-dashed border-white/20 bg-blue-500/10 p-3 backdrop-blur-sm">
                      <p className="text-xs leading-relaxed text-slate-200">
                        Stay under 3 active cards to avoid credit score swings. We'll remind you before any
                        annual fee hits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gamification Section: Example Projections */}
          <div className="mt-16 space-y-8 md:mt-24">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">See Your Path to Rewards</h2>
              <p className="text-lg text-slate-400">
                Visualize how many cards and months to reach your travel goals
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Domestic Flight Example */}
              <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-2xl ring-1 ring-white/10">
                      ✈️
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                        Example Goal
                      </p>
                      <p className="text-lg font-bold text-white">Free Domestic Flight</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-teal-400">4</span>
                      <span className="text-xl font-semibold text-slate-300">months</span>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <p className="text-xs font-semibold text-slate-400">With 1 card:</p>
                      <p className="mt-1 text-base font-semibold text-white">ANZ Rewards Black</p>
                      <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3 text-sm text-slate-300">
                        <span>15k pts</span>
                        <span className="text-slate-600">•</span>
                        <span>$375 fee</span>
                        <span className="text-slate-600">•</span>
                        <span className="font-semibold text-teal-400">$75 net</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-blue-500/10 px-4 py-2 text-sm text-slate-300">
                      Sydney → Melbourne return • Worth: $150
                    </div>
                  </div>
                </div>
              </div>

              {/* International Flight Example */}
              <div className="group relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 p-6 backdrop-blur-sm transition-all hover:border-teal-500/50">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-teal-500/10 blur-3xl"></div>
                <div className="relative space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 text-2xl ring-1 ring-teal-400/30">
                      🌏
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                        Example Goal
                      </p>
                      <p className="text-lg font-bold text-white">International Economy</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-teal-400">10</span>
                      <span className="text-xl font-semibold text-slate-300">months</span>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <p className="text-xs font-semibold text-slate-400">With 2 cards:</p>
                      <p className="mt-1 text-base font-semibold text-white">ANZ + Westpac Altitude Black</p>
                      <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3 text-sm text-slate-300">
                        <span>80k pts</span>
                        <span className="text-slate-600">•</span>
                        <span>$670 fees</span>
                        <span className="text-slate-600">•</span>
                        <span className="font-semibold text-teal-400">$130 net</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-blue-500/10 px-4 py-2 text-sm text-slate-300">
                      Sydney → Tokyo return • Worth: $800
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-6">
              <a
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-teal-500/30"
              >
                Start Tracking Your Cards
              </a>
              <p className="mt-3 text-sm text-slate-400">
                Free forever • No credit card required
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
