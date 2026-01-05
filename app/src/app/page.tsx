"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Lock,
  ChartBar,
  Zap,
  Plane,
  Globe,
  Sparkles,
  Calendar,
  Target,
  FileText,
  Lightbulb,
  Check
} from "lucide-react"
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

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0e1a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Reward Relay" width={32} height={32} className="drop-shadow-lg" />
            <span className="text-xl font-bold text-white">Reward Relay</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-2 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/5"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-teal-500/30"
            >
              Sign up
            </a>
          </div>
        </div>
      </header>

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
                    seamlessly
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

          {/* Social Proof / Trust Signals */}
          <div className="mt-16 md:mt-20">
            <div className="text-center mb-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-teal-400">
                Built for Australian Churners
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-white/10">
                  <Lock className="h-6 w-6 text-teal-400" />
                </div>
                <p className="text-center text-sm font-semibold text-white">Your data stays in Australia</p>
                <p className="text-center text-xs text-slate-400">No offshore storage. Compliant with local privacy laws.</p>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-white/10">
                  <ChartBar className="h-6 w-6 text-teal-400" />
                </div>
                <p className="text-center text-sm font-semibold text-white">Track unlimited cards</p>
                <p className="text-center text-xs text-slate-400">Pro tier removes all limits. Churn as many as you want.</p>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-white/10">
                  <Zap className="h-6 w-6 text-teal-400" />
                </div>
                <p className="text-center text-sm font-semibold text-white">Never miss a cancellation deadline</p>
                <p className="text-center text-xs text-slate-400">Email reminders at 30, 14, and 7 days before annual fee.</p>
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Domestic Flight Example */}
              <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 ring-1 ring-white/10">
                      <Plane className="h-6 w-6 text-blue-400" />
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-400/30">
                      <Globe className="h-6 w-6 text-teal-400" />
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

              {/* Business Class Example */}
              <div className="group relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 backdrop-blur-sm transition-all hover:border-purple-500/50">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl"></div>
                <div className="relative space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 ring-1 ring-purple-400/30">
                      <Sparkles className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                        Pro Goal
                      </p>
                      <p className="text-lg font-bold text-white">Business Class Asia</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-purple-400">18</span>
                      <span className="text-xl font-semibold text-slate-300">months</span>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <p className="text-xs font-semibold text-slate-400">With 3 cards:</p>
                      <p className="mt-1 text-base font-semibold text-white">ANZ + Westpac + AMEX</p>
                      <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3 text-sm text-slate-300">
                        <span>200k pts</span>
                        <span className="text-slate-600">•</span>
                        <span>$1,145 fees</span>
                        <span className="text-slate-600">•</span>
                        <span className="font-semibold text-purple-400">$855 net</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-purple-500/10 px-4 py-2 text-sm text-slate-300">
                      Sydney → Singapore return • Worth: $2,000
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-purple-400/20 bg-purple-500/10 px-3 py-2 text-xs text-purple-200">
                      <Lightbulb className="h-4 w-4" />
                      <span>Pro members: Calculate YOUR custom goals</span>
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
                Start with free tier • Upgrade anytime
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mt-24 space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Everything You Need to Churn Smarter</h2>
              <p className="text-lg text-slate-400">
                Powerful features that help you maximize rewards while staying organized
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Visual Calendar */}
              <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-400/30">
                  <Calendar className="h-8 w-8 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Visual Churning Calendar</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    See your entire card journey from application to re-eligibility. Never lose track of the 12-month rule.
                  </p>
                </div>
              </div>

              {/* Smart Recommendations */}
              <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 ring-1 ring-purple-400/30">
                  <Target className="h-8 w-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Smart Recommendations</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    AI-powered card suggestions based on your eligibility, portfolio, and goals. Know exactly what to apply for next.
                  </p>
                </div>
              </div>

              {/* CSV Upload */}
              <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 ring-1 ring-blue-400/30">
                  <FileText className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">CSV Statement Upload</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Bulk import transactions from CommBank, ANZ, NAB, and Westpac. Track spending requirements automatically.
                  </p>
                </div>
              </div>

              {/* Daily Insights */}
              <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 ring-1 ring-orange-400/30">
                  <Lightbulb className="h-8 w-8 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Daily Insights & Deals</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Personalized tips, OzBargain credit card deals, and streak rewards. Stay engaged and informed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mt-24 space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Simple, Transparent Pricing</h2>
              <p className="text-lg text-slate-400">
                Start free, upgrade when you're ready to unlock all features
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Free Tier */}
              <div className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white">Free</h3>
                  <p className="mt-2 text-sm text-slate-400">Perfect for trying it out</p>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">$0</span>
                  <span className="text-slate-400">/month</span>
                </div>
                <ul className="mb-8 flex-1 space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-400" />
                    <span>Track 2-3 cards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-400" />
                    <span>Basic reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-400" />
                    <span>12-month rule tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-400" />
                    <span>Manual transaction entry</span>
                  </li>
                </ul>
                <a
                  href="/signup"
                  className="rounded-full border-2 border-white/20 bg-white/5 px-6 py-3 text-center font-semibold text-white transition-all hover:border-white/30 hover:bg-white/10"
                >
                  Start Free
                </a>
              </div>

              {/* Pro Monthly */}
              <div className="relative flex flex-col rounded-3xl border-2 border-teal-500/50 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 p-8 backdrop-blur-sm shadow-xl shadow-teal-500/20">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-1 text-xs font-bold text-white">
                  MOST POPULAR
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white">Pro Monthly</h3>
                  <p className="mt-2 text-sm text-slate-400">For serious churners</p>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">$39</span>
                  <span className="text-slate-400">/month</span>
                </div>
                <ul className="mb-8 flex-1 space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-400" />
                    <span><strong>Unlimited cards</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-400" />
                    <span><strong>Smart recommendations</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-400" />
                    <span><strong>Goal projections & timeline</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-400" />
                    <span><strong>CSV statement upload</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-400" />
                    <span>Daily insights & deals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-400" />
                    <span>Streak rewards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-400" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <a
                  href="/signup"
                  className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3 text-center font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-teal-500/30"
                >
                  Start 7-Day Trial
                </a>
                <p className="mt-3 text-center text-xs text-slate-400">Then $39/month • Cancel anytime</p>
              </div>

              {/* Pro Annual */}
              <div className="flex flex-col rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 backdrop-blur-sm">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white">Pro Annual</h3>
                  <p className="mt-2 text-sm text-purple-300">Save $78/year</p>
                </div>
                <div className="mb-6">
                  <div>
                    <span className="text-5xl font-bold text-white">$390</span>
                    <span className="text-slate-400">/year</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    <span className="font-semibold text-purple-300">$32.50/month</span> effective
                  </p>
                </div>
                <ul className="mb-8 flex-1 space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-400" />
                    <span><strong>Everything in Pro Monthly</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-400" />
                    <span><strong>17% discount ($78 saved)</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-400" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-400" />
                    <span>Early access to new features</span>
                  </li>
                </ul>
                <a
                  href="/signup"
                  className="rounded-full border-2 border-purple-400/50 bg-purple-500/20 px-6 py-3 text-center font-semibold text-white transition-all hover:border-purple-400/70 hover:bg-purple-500/30"
                >
                  Start Annual Trial
                </a>
                <p className="mt-3 text-center text-xs text-slate-400">7-day trial • Then $390 billed annually</p>
              </div>
            </div>

            <div className="text-center">
              <p className="flex items-center justify-center gap-2 text-sm text-slate-300">
                <Lightbulb className="h-5 w-5 text-teal-400" />
                <span><strong>Earn back your subscription</strong> in just ONE sign-up bonus (avg $1,200 value)</span>
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-24 space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Frequently Asked Questions</h2>
            </div>

            <div className="mx-auto max-w-3xl space-y-4">
              <details className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-white">
                  What happens after the 7-day free trial?
                  <span className="text-teal-400 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-4 text-sm text-slate-300">
                  After 7 days, you'll be charged $39/month (or $390/year for annual). You can cancel anytime before the trial ends with no charge. No credit card tricks—just honest billing.
                </p>
              </details>

              <details className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-white">
                  Can I cancel anytime?
                  <span className="text-teal-400 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-4 text-sm text-slate-300">
                  Yes! Cancel anytime from your account settings. If you cancel mid-month, you'll keep Pro access until the end of your billing period. No penalties, no hassle.
                </p>
              </details>

              <details className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-white">
                  Do you store my credit card numbers?
                  <span className="text-teal-400 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-4 text-sm text-slate-300">
                  <strong>No.</strong> We only track card metadata—bank name, application dates, cancellation dates, and your notes. We never store or see your actual credit card numbers or PINs.
                </p>
              </details>

              <details className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-white">
                  What's the 12-month rule?
                  <span className="text-teal-400 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-4 text-sm text-slate-300">
                  Most Australian banks require you to wait 12 months after cancelling a card before you're eligible for sign-up bonuses on another card from that same bank. Reward Relay automatically tracks this for you.
                </p>
              </details>

              <details className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-white">
                  How do I upgrade from Free to Pro?
                  <span className="text-teal-400 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-4 text-sm text-slate-300">
                  Click "Upgrade to Pro" in your dashboard settings. Choose monthly or annual, start your 7-day trial, and all Pro features unlock immediately. You'll keep all your existing data.
                </p>
              </details>

              <details className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-white">
                  Is my data secure?
                  <span className="text-teal-400 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-4 text-sm text-slate-300">
                  Yes. Your data is encrypted in transit and at rest, stored in Australia, and protected by industry-standard security. We use Row Level Security so you can only access your own data.
                </p>
              </details>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
