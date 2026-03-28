"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Lock,
  BarChart3,
  Zap,
  Plane,
  Globe,
  Sparkles,
  Calendar,
  Target,
  FileText,
  Lightbulb,
  Check,
} from "lucide-react"
import Header from "@/components/layout/Header"
import { supabase } from "@/lib/supabase/client"
import { getBankGradient } from "@/lib/bank-gradients"
import { BetaGate } from "@/components/ui/BetaGate"
import { BetaOnly } from "@/components/ui/BetaOnly"
import { BetaRequestForm } from "@/components/forms/BetaRequestForm"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  return (
    <div
      className="relative flex flex-col text-white"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Background glow blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute left-[-10%] top-[10%] h-[600px] w-[600px] rounded-full blur-[120px]"
          style={{ background: "rgba(78, 222, 163, 0.08)" }}
        />
        <div
          className="absolute bottom-[10%] right-[-10%] h-[600px] w-[600px] rounded-full blur-[120px]"
          style={{ background: "rgba(208, 188, 255, 0.04)" }}
        />
      </div>

      <Header logoClickable={false} />

      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="relative flex min-h-[800px] items-center justify-center overflow-hidden px-6 py-20 md:px-20 md:py-28">
          {/* Ambient green glow — left edge bleeds to right */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute -left-40 top-1/2 h-[700px] w-[700px] -translate-y-1/2 rounded-full blur-[130px]"
              style={{ background: "rgba(78, 222, 163, 0.07)" }}
            />
          </div>
          <div className="relative z-10 mx-auto max-w-5xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(78, 222, 163, 0.1)", color: "var(--primary)" }}>
              Command Your Wealth
            </div>

            {/* Headline */}
            <h1 className="mb-6 font-headline text-5xl font-extrabold leading-[1.1] tracking-tight text-on-surface md:text-7xl">
              Master the{" "}
              <span className="text-[#4edea3]">Churn</span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed md:text-xl"
              style={{ color: "var(--on-surface-variant)" }}>
              The high-stakes command center for credit card optimization and point maximization. Orchestrate your credit portfolio with the precision of a master.
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
              {isLoggedIn ? (
                <a
                  href="/dashboard"
                  className="bg-primary-gradient w-full rounded-full px-10 py-4 text-lg font-bold text-on-primary shadow-lg shadow-[#4edea3]/20 transition-transform hover:scale-105 md:w-auto"
                >
                  Go to Dashboard →
                </a>
              ) : (
                <a
                  href="/signup"
                  className="bg-primary-gradient w-full rounded-full px-10 py-4 text-lg font-bold text-on-primary shadow-lg shadow-[#4edea3]/20 transition-transform hover:scale-105 md:w-auto"
                >
                  Join the Elite
                </a>
              )}
              <a
                href="#how-it-works"
                className="w-full rounded-full border px-10 py-4 text-lg font-bold transition-colors hover:bg-white/10 md:w-auto"
                style={{
                  borderColor: "rgba(78, 222, 163, 0.25)",
                  background: "rgba(27, 31, 44, 0.6)",
                  backdropFilter: "blur(20px)",
                  color: "var(--on-surface)",
                }}
              >
                View Live Dashboard
              </a>
            </div>

            {/* Social proof — avatar stack */}
            <div className="mt-16 flex flex-col items-center gap-4">
              <div className="flex items-center -space-x-3">
                {[
                  { bg: "from-emerald-500 to-teal-600", label: "A" },
                  { bg: "from-violet-500 to-purple-600", label: "B" },
                  { bg: "from-blue-500 to-indigo-600", label: "C" },
                  { bg: "from-rose-500 to-pink-600", label: "D" },
                  { bg: "from-amber-500 to-orange-600", label: "E" },
                ].map(({ bg, label }) => (
                  <div
                    key={label}
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${bg} ring-2 ring-surface text-xs font-bold text-white`}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <p className="text-sm font-semibold text-on-surface-variant">
                Join{" "}
                <span className="font-bold text-[#4edea3]">2,400+</span>{" "}
                points optimisers
              </p>
            </div>
          </div>
        </section>

        {/* Trusted By strip */}
        <section className="border-y border-white/5 py-10" style={{ backgroundColor: "var(--surface-container)" }}>
          <div className="mx-auto max-w-4xl px-6">
            <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              Trusted by 5,000+ Aussie Points Hackers
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { bank: "Amex", label: "AMEX" },
                { bank: "ANZ", label: "ANZ" },
                { bank: "CommBank", label: "COMMBANK" },
                { bank: "Westpac", label: "WESTPAC" },
                { bank: "NAB", label: "NAB" },
              ].map(({ bank, label }) => (
                <div
                  key={bank}
                  className="rounded-md px-4 py-2 text-[11px] font-extrabold tracking-widest text-white shadow-sm"
                  style={{ background: getBankGradient(bank) }}
                >
                  {label}
                </div>
              ))}
              <div
                className="rounded-md px-4 py-2 text-[11px] font-extrabold tracking-widest text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #c00 0%, #8b0000 100%)" }}
              >
                QANTAS
              </div>
              <div
                className="rounded-md px-4 py-2 text-[11px] font-extrabold tracking-widest text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #e85d04 0%, #b44000 100%)" }}
              >
                VELOCITY
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="bg-surface-container-low px-6 py-24 md:px-20">
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h2 className="font-headline mb-4 text-4xl font-extrabold text-on-surface">
                How it Works
              </h2>
              <div className="mx-auto h-1.5 w-16 rounded-full bg-[#4edea3]" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  num: "1",
                  title: "Connect Your Vault",
                  body: "Securely link your bank accounts using military-grade encryption to aggregate your entire financial footprint.",
                },
                {
                  num: "2",
                  title: "Algorithm Audit",
                  body: "Our proprietary engine analyzes your spending patterns against 500+ credit card offers to find your optimal path.",
                },
                {
                  num: "3",
                  title: "Execute & Conquer",
                  body: "Receive real-time notifications on when to spend, when to apply, and when to close to keep your credit score pristine.",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="flex flex-col gap-6 rounded-2xl border p-8"
                  style={{
                    background: "rgba(27,31,44,0.6)",
                    borderColor: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#4edea3]/20 bg-[#4edea3]/10 text-2xl font-headline font-bold text-[#4edea3]">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-headline mb-3 text-xl font-bold text-on-surface">
                      {step.title}
                    </h3>
                    <p className="leading-relaxed text-on-surface-variant">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Visual Showcase */}
        <section className="mx-auto max-w-7xl px-8 py-24">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            {/* Spend progress ring */}
            <div
              className="flex flex-col items-center justify-center overflow-hidden rounded-2xl p-10 text-center md:col-span-12 lg:col-span-5"
              style={{ backgroundColor: "var(--surface-container)", border: "1px solid rgba(60, 74, 66, 0.1)" }}
            >
              <h3
                className="mb-10 text-3xl font-bold"
                style={{ fontFamily: "var(--font-grotesk)" }}
              >
                Active Card Progress
              </h3>
              <div className="relative h-64 w-64">
                <svg className="h-full w-full -rotate-90">
                  <circle cx="128" cy="128" r="110" fill="transparent" stroke="var(--surface-container-highest)" strokeWidth="16" />
                  <circle
                    cx="128"
                    cy="128"
                    r="110"
                    fill="transparent"
                    stroke="var(--primary)"
                    strokeWidth="16"
                    strokeDasharray="691"
                    strokeDashoffset="103"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-extrabold tabular-nums" style={{ fontFamily: "var(--font-grotesk)" }}>
                    $3,420
                  </span>
                  <span className="mt-1 text-sm font-medium uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                    of $4,000 goal
                  </span>
                </div>
              </div>
              <div
                className="mt-10 rounded-full px-6 py-2 text-sm font-bold uppercase tracking-widest"
                style={{ background: "rgba(78, 222, 163, 0.1)", color: "var(--primary)" }}
              >
                85% Complete — 12 Days Left
              </div>
            </div>

            {/* Card portfolio stack */}
            <div
              className="relative flex flex-col justify-between overflow-hidden rounded-2xl p-10 md:col-span-12 lg:col-span-7"
              style={{ backgroundColor: "var(--surface-container)", border: "1px solid rgba(60, 74, 66, 0.1)" }}
            >
              <div className="relative z-10">
                <h3
                  className="mb-4 text-3xl font-bold"
                  style={{ fontFamily: "var(--font-grotesk)" }}
                >
                  Portfolio Integration
                </h3>
                <p className="max-w-md text-lg" style={{ color: "var(--on-surface-variant)" }}>
                  Visualise your entire card portfolio in one command center.
                </p>
              </div>

              {/* Stacked card visuals */}
              <div className="relative mb-4 mt-12 flex h-64 justify-center">
                {/* NAB */}
                <div
                  className="absolute z-10 h-48 w-80 -translate-x-24 translate-y-16 -rotate-12 rounded-xl border p-6 shadow-2xl"
                  style={{
                    background: "linear-gradient(135deg, #c91d1d, #7a0a0a)",
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Rewards Premium</p>
                  <div className="mt-8">
                    <p className="text-2xl font-bold tabular-nums text-white">42.1k</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/60">NAB Rewards</p>
                  </div>
                </div>
                {/* CBA */}
                <div
                  className="absolute z-20 h-48 w-80 -translate-x-8 translate-y-8 -rotate-3 rounded-xl border p-6 shadow-2xl"
                  style={{
                    background: "linear-gradient(135deg, #ffcc00, #e6b800)",
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/80">Ultimate Awards</p>
                  <div className="mt-8">
                    <p className="text-2xl font-bold tabular-nums text-black">67.8k</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-black/60">CommBank</p>
                  </div>
                </div>
                {/* ANZ */}
                <div
                  className="absolute z-30 h-48 w-80 translate-x-12 translate-y-4 rotate-6 rounded-xl border p-6 shadow-2xl"
                  style={{
                    background: "linear-gradient(135deg, #004165, #002a42)",
                    borderColor: "rgba(96, 165, 250, 0.2)",
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100/80">Black Qantas</p>
                  <div className="mt-8">
                    <p className="text-2xl font-bold tabular-nums text-white">112.4k</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#60a5fa" }}>ANZ FF</p>
                  </div>
                </div>
                {/* Amex */}
                <div
                  className="absolute z-40 h-48 w-80 -translate-y-4 translate-x-24 rotate-12 rounded-xl border p-6 shadow-2xl"
                  style={{
                    background: "linear-gradient(135deg, #1b1f2c, #0a0e1a)",
                    borderColor: "rgba(255,255,255,0.1)",
                    boxShadow: "0 0 0 1px rgba(78, 222, 163, 0.2)",
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Platinum Command</p>
                  <div className="mt-8">
                    <p className="text-2xl font-bold tabular-nums text-white">245.5k</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>AMEX Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gamification / Example projections */}
        <section className="space-y-8 px-8 py-16 md:py-24">
          <div className="space-y-3 text-center">
            <h2
              className="text-3xl font-bold sm:text-4xl"
              style={{ fontFamily: "var(--font-grotesk)" }}
            >
              See Your Path to Rewards
            </h2>
            <p className="text-lg" style={{ color: "var(--on-surface-variant)" }}>
              Visualize how many cards and months to reach your travel goals
            </p>
          </div>

          <div className="mx-auto max-w-7xl grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Domestic */}
            <div
              className="group relative overflow-hidden rounded-3xl p-6 transition-all"
              style={{
                background: "rgba(27, 31, 44, 0.5)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(78,222,163,0.2))",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Plane className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>
                      Example Goal
                    </p>
                    <p className="text-lg font-bold text-white">Free Domestic Flight</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold" style={{ color: "var(--primary)" }}>4</span>
                    <span className="text-xl font-semibold" style={{ color: "var(--on-surface-variant)" }}>months</span>
                  </div>
                  <div
                    className="rounded-2xl border p-4"
                    style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    <p className="text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>With 1 card:</p>
                    <p className="mt-1 text-base font-semibold text-white">ANZ Rewards Black</p>
                    <div className="mt-3 flex items-center gap-3 border-t pt-3 text-sm"
                      style={{ borderColor: "rgba(255,255,255,0.08)", color: "var(--on-surface-variant)" }}>
                      <span>15k pts</span>
                      <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
                      <span>$375 fee</span>
                      <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
                      <span className="font-semibold" style={{ color: "var(--primary)" }}>$75 net</span>
                    </div>
                  </div>
                  <div className="rounded-xl px-4 py-2 text-sm"
                    style={{ background: "rgba(59,130,246,0.1)", color: "var(--on-surface)" }}>
                    Sydney → Melbourne return • Worth: $150
                  </div>
                </div>
              </div>
            </div>

            {/* International */}
            <div
              className="group relative overflow-hidden rounded-3xl p-6 transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(78,222,163,0.08), rgba(16,185,129,0.06))",
                border: "1px solid rgba(78,222,163,0.25)",
              }}
            >
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full blur-3xl"
                style={{ background: "rgba(78,222,163,0.1)" }} />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      background: "rgba(78,222,163,0.15)",
                      border: "1px solid rgba(78,222,163,0.25)",
                    }}
                  >
                    <Globe className="h-6 w-6" style={{ color: "var(--primary)" }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>
                      Example Goal
                    </p>
                    <p className="text-lg font-bold text-white">International Economy</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold" style={{ color: "var(--primary)" }}>10</span>
                    <span className="text-xl font-semibold" style={{ color: "var(--on-surface-variant)" }}>months</span>
                  </div>
                  <div
                    className="rounded-2xl border p-4"
                    style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    <p className="text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>With 2 cards:</p>
                    <p className="mt-1 text-base font-semibold text-white">ANZ + Westpac Altitude Black</p>
                    <div className="mt-3 flex items-center gap-3 border-t pt-3 text-sm"
                      style={{ borderColor: "rgba(255,255,255,0.08)", color: "var(--on-surface-variant)" }}>
                      <span>80k pts</span>
                      <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
                      <span>$670 fees</span>
                      <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
                      <span className="font-semibold" style={{ color: "var(--primary)" }}>$130 net</span>
                    </div>
                  </div>
                  <div className="rounded-xl px-4 py-2 text-sm"
                    style={{ background: "rgba(59,130,246,0.1)", color: "var(--on-surface)" }}>
                    Sydney → Tokyo return • Worth: $800
                  </div>
                </div>
              </div>
            </div>

            {/* Business Class */}
            <div
              className="group relative overflow-hidden rounded-3xl p-6 transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.06))",
                border: "1px solid rgba(139,92,246,0.25)",
              }}
            >
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full blur-3xl"
                style={{ background: "rgba(139,92,246,0.1)" }} />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2))",
                      border: "1px solid rgba(139,92,246,0.25)",
                    }}
                  >
                    <Sparkles className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <BetaGate>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Pro Goal</p>
                    </BetaGate>
                    <BetaOnly>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Example Goal</p>
                    </BetaOnly>
                    <p className="text-lg font-bold text-white">Business Class Asia</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-purple-400">18</span>
                    <span className="text-xl font-semibold" style={{ color: "var(--on-surface-variant)" }}>months</span>
                  </div>
                  <div
                    className="rounded-2xl border p-4"
                    style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    <p className="text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>With 3 cards:</p>
                    <p className="mt-1 text-base font-semibold text-white">ANZ + Westpac + AMEX</p>
                    <div className="mt-3 flex items-center gap-3 border-t pt-3 text-sm"
                      style={{ borderColor: "rgba(255,255,255,0.08)", color: "var(--on-surface-variant)" }}>
                      <span>200k pts</span>
                      <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
                      <span>$1,145 fees</span>
                      <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
                      <span className="font-semibold text-purple-400">$855 net</span>
                    </div>
                  </div>
                  <div className="rounded-xl px-4 py-2 text-sm"
                    style={{ background: "rgba(139,92,246,0.1)", color: "var(--on-surface)" }}>
                    Sydney → Singapore return • Worth: $2,000
                  </div>
                  <BetaGate>
                    <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs text-purple-200"
                      style={{ borderColor: "rgba(167,139,250,0.2)", background: "rgba(139,92,246,0.1)" }}>
                      <Lightbulb className="h-4 w-4" />
                      <span>Pro members: Calculate YOUR custom goals</span>
                    </div>
                  </BetaGate>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 text-center">
            <BetaGate>
              <a
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #4edea3 0%, #10b981 100%)",
                  color: "#003824",
                  boxShadow: "0 8px 24px rgba(78, 222, 163, 0.2)",
                }}
              >
                Start Tracking Your Cards
              </a>
              <p className="mt-3 text-sm" style={{ color: "var(--on-surface-variant)" }}>Start with free tier • Upgrade anytime</p>
            </BetaGate>
            <BetaOnly>
              <BetaRequestForm
                buttonText="Start Tracking Your Cards"
                subtitle="Join the private beta • Free during testing"
              />
            </BetaOnly>
          </div>
        </section>

        {/* Feature highlights */}
        <section className="px-8 py-24" style={{ backgroundColor: "var(--surface)" }}>
          <div className="mx-auto max-w-7xl space-y-8">
            <div className="space-y-3 text-center">
              <h2
                className="text-3xl font-bold sm:text-4xl"
                style={{ fontFamily: "var(--font-grotesk)" }}
              >
                Everything You Need to Churn Smarter
              </h2>
              <p className="text-lg" style={{ color: "var(--on-surface-variant)" }}>
                Powerful features that help you maximize rewards while staying organized
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: <Calendar className="h-8 w-8" style={{ color: "var(--primary)" }} />,
                  iconBg: "rgba(78,222,163,0.15)",
                  iconBorder: "rgba(78,222,163,0.25)",
                  title: "Visual Churning Calendar",
                  body: "See your entire card journey from application to re-eligibility. Never lose track of the 12-month rule.",
                },
                {
                  icon: <Target className="h-8 w-8 text-purple-400" />,
                  iconBg: "rgba(139,92,246,0.15)",
                  iconBorder: "rgba(139,92,246,0.25)",
                  title: "Smart Recommendations",
                  body: "Card suggestions based on your eligibility, portfolio, and goals. Know exactly what to apply for next.",
                },
                {
                  icon: <FileText className="h-8 w-8 text-blue-400" />,
                  iconBg: "rgba(59,130,246,0.15)",
                  iconBorder: "rgba(59,130,246,0.25)",
                  title: "CSV Statement Upload",
                  body: "Bulk import transactions from CommBank, ANZ, NAB, and Westpac. Track spending requirements automatically.",
                },
                {
                  icon: <Lightbulb className="h-8 w-8 text-orange-400" />,
                  iconBg: "rgba(249,115,22,0.15)",
                  iconBorder: "rgba(249,115,22,0.25)",
                  title: "Daily Insights & Deals",
                  body: "Personalized tips, OzBargain credit card deals, and streak rewards. Stay engaged and informed.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="flex flex-col gap-4 rounded-2xl p-6"
                  style={{ backgroundColor: "var(--surface-container)", border: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: f.iconBg, border: `1px solid ${f.iconBorder}` }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                    <p className="mt-2 text-sm" style={{ color: "var(--on-surface-variant)" }}>{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust signals */}
        <section className="px-8 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-center">
              <p className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>
                Built for Australian Churners
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: <Lock className="h-6 w-6" style={{ color: "var(--primary)" }} />,
                  title: "Your data stays in Australia",
                  body: "No offshore storage. Compliant with local privacy laws.",
                },
                {
                  icon: <BarChart3 className="h-6 w-6" style={{ color: "var(--primary)" }} />,
                  title: "Track unlimited cards",
                  body: "Pro tier removes all limits. Churn as many as you want.",
                },
                {
                  icon: <Zap className="h-6 w-6" style={{ color: "var(--primary)" }} />,
                  title: "Never miss a cancellation deadline",
                  body: "Email reminders at 30, 14, and 7 days before annual fee.",
                },
              ].map((t) => (
                <div
                  key={t.title}
                  className="flex flex-col items-center gap-3 rounded-2xl p-6 text-center"
                  style={{
                    background: "rgba(27, 31, 44, 0.5)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: "rgba(78,222,163,0.12)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {t.icon}
                  </div>
                  <p className="text-sm font-semibold text-white">{t.title}</p>
                  <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{t.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <BetaGate>
          <section className="px-8 py-24" style={{ backgroundColor: "var(--surface)" }}>
            <div className="mx-auto max-w-7xl space-y-8">
              <div className="space-y-3 text-center">
                <h2
                  className="text-3xl font-bold sm:text-4xl"
                  style={{ fontFamily: "var(--font-grotesk)" }}
                >
                  Select Your Plan
                </h2>
                <p style={{ color: "var(--on-surface-variant)" }}>
                  Professional tools for the modern financial luminary.
                </p>
              </div>

              <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
                {/* Lite */}
                <div
                  className="flex flex-col rounded-2xl p-10 transition-all hover:border-[rgba(78,222,163,0.2)]"
                  style={{
                    backgroundColor: "var(--surface-container)",
                    border: "1px solid rgba(60, 74, 66, 0.1)",
                  }}
                >
                  <div className="mb-8">
                    <h3 className="mb-2 text-2xl font-bold" style={{ fontFamily: "var(--font-grotesk)" }}>
                      Lite Relay
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tabular-nums">$0</span>
                      <span style={{ color: "var(--on-surface-variant)" }}>/month</span>
                    </div>
                  </div>
                  <ul className="mb-10 flex-grow space-y-4">
                    {["Up to 2 Bank Syncs", "Basic Point Dashboard"].map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <Check className="h-5 w-5 shrink-0 text-outline" />
                        {f}
                      </li>
                    ))}
                    <li className="flex items-center gap-3 text-sm opacity-40">
                      <Check className="h-5 w-5 shrink-0 text-outline" />
                      No Churn Strategy
                    </li>
                  </ul>
                  <a
                    href="/signup"
                    className="rounded-full py-4 text-center font-bold text-white transition-colors hover:bg-white/10"
                    style={{ border: "1px solid rgba(134, 148, 138, 0.5)" }}
                  >
                    Start Free
                  </a>
                </div>

                {/* Command Center */}
                <div
                  className="relative flex flex-col overflow-hidden rounded-2xl p-10 shadow-2xl"
                  style={{
                    backgroundColor: "var(--surface-container-highest)",
                    border: "2px solid var(--primary)",
                    boxShadow: "0 0 40px rgba(78,222,163,0.1)",
                  }}
                >
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl"
                    style={{ background: "rgba(78,222,163,0.1)" }} />
                  <div
                    className="absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-primary-gradient text-on-primary"
                  >
                    Most Popular
                  </div>
                  <div className="mb-8">
                    <h3 className="mb-2 text-2xl font-bold font-headline">
                      Command Center
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tabular-nums">$29</span>
                      <span style={{ color: "var(--on-surface-variant)" }}>/month</span>
                    </div>
                  </div>
                  <ul className="mb-10 flex-grow space-y-4">
                    {[
                      "Unlimited Bank Sync",
                      "Sign-up Bonus Tracker",
                      "Custom Churn Strategy",
                      "Priority Concierge Support",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <Check className="h-5 w-5 shrink-0" style={{ color: "var(--primary)" }} />
                        <strong>{f}</strong>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/signup"
                    className="rounded-full py-4 text-center font-bold transition-all hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #4edea3 0%, #10b981 100%)",
                      color: "#003824",
                      boxShadow: "0 8px 24px rgba(78, 222, 163, 0.2)",
                    }}
                  >
                    Upgrade Now
                  </a>
                </div>
              </div>

              <div className="text-center">
                <p className="flex items-center justify-center gap-2 text-sm" style={{ color: "var(--on-surface)" }}>
                  <Lightbulb className="h-5 w-5" style={{ color: "var(--primary)" }} />
                  <span>
                    <strong>Earn back your subscription</strong> in just ONE sign-up bonus (avg $1,200 value)
                  </span>
                </p>
              </div>
            </div>
          </section>
        </BetaGate>

        {/* Beta-Only */}
        <BetaOnly>
          <section className="px-8 py-24" style={{ backgroundColor: "var(--surface)" }}>
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              <div
                className="inline-flex items-center gap-2 rounded-full px-6 py-3"
                style={{
                  border: "1px solid rgba(78,222,163,0.25)",
                  background: "rgba(78,222,163,0.08)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <Lock className="h-5 w-5" style={{ color: "var(--primary)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                  Private Beta • Invite Only
                </span>
              </div>
              <h2
                className="text-3xl font-bold sm:text-4xl"
                style={{ fontFamily: "var(--font-grotesk)" }}
              >
                Join the Private Beta
              </h2>
              <p className="text-lg" style={{ color: "var(--on-surface)" }}>
                We&apos;re testing Reward Relay with a small group of Australian churners. During the
                private beta, all features are{" "}
                <strong style={{ color: "var(--primary)" }}>completely free</strong>.
              </p>
              <div className="grid gap-4 pt-4 text-left md:grid-cols-2">
                {[
                  { title: "Unlimited everything", body: "Track unlimited cards, get all recommendations, use every feature" },
                  { title: "Shape the product", body: "Your feedback directly influences features and improvements" },
                  { title: "Early adopter benefits", body: "Special pricing when we launch publicly (details TBA)" },
                  { title: "Australian-first", body: "Built specifically for Australian banks, cards, and churning rules" },
                ].map((b) => (
                  <div
                    key={b.title}
                    className="rounded-2xl p-6"
                    style={{
                      background: "rgba(27, 31, 44, 0.5)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Check className="mt-1 h-5 w-5 shrink-0" style={{ color: "var(--primary)" }} />
                      <div>
                        <p className="font-semibold text-white">{b.title}</p>
                        <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>{b.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-6">
                <BetaRequestForm />
              </div>
            </div>
          </section>
        </BetaOnly>

        {/* Testimonials */}
        <section className="mx-auto max-w-5xl px-8 py-24">
          <h2
            className="mb-16 text-center text-4xl font-extrabold"
            style={{ fontFamily: "var(--font-grotesk)" }}
          >
            Wall of Luminary
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {[
              {
                quote:
                  '"Reward Relay turned my casual spending into first-class tickets around the world. The UI is cleaner than my banking app."',
                name: "Alex Chen",
                role: "Churning since 2019",
              },
              {
                quote:
                  '"The only platform that understands the nuance of the 12-month rule perfectly. A must-have for serious collectors."',
                name: "Sarah Jenkins",
                role: "Venture Capitalist",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="relative rounded-2xl p-8 italic"
                style={{
                  border: "1px solid rgba(60, 74, 66, 0.1)",
                  color: "var(--on-surface-variant)",
                }}
              >
                <span
                  className="absolute -top-4 left-6 text-5xl"
                  style={{ color: "rgba(78,222,163,0.15)" }}
                >
                  &ldquo;
                </span>
                <p className="relative z-10 mb-8 text-lg leading-relaxed">{t.quote}</p>
                <div className="flex items-center gap-4 not-italic">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full font-bold text-white"
                    style={{ backgroundColor: "var(--surface-container-highest)", border: "1px solid rgba(78,222,163,0.2)" }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-white" style={{ fontFamily: "var(--font-grotesk)" }}>
                      {t.name}
                    </p>
                    <p
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: "var(--primary)" }}
                    >
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-8 py-24 text-center">
          <div className="glass-card relative mx-auto max-w-4xl overflow-hidden rounded-lg p-16 border border-outline-variant/10">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px]"
              style={{ background: "rgba(78,222,163,0.05)" }}
            />
            <h2 className="mb-6 font-headline text-4xl font-extrabold md:text-5xl">
              Ready to Master the Churn?
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-lg" style={{ color: "var(--on-surface-variant)" }}>
              Stop leaving points on the table. Join 5,000+ Aussies who have optimized their credit
              card game with precision.
            </p>
            <BetaOnly>
              <BetaRequestForm
                buttonText="Get Early Access"
                buttonClassName="px-12 py-4 bg-primary-gradient text-on-primary font-headline font-bold rounded-full hover:scale-105 transition-transform shadow-lg shadow-[#4edea3]/20"
                variant="inline"
              />
            </BetaOnly>
            <BetaGate>
              <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
                <a
                  href="/login"
                  className="w-full rounded-full px-10 py-4 text-lg font-bold transition-all hover:scale-105 md:w-auto"
                  style={{
                    background: "linear-gradient(135deg, #4edea3 0%, #10b981 100%)",
                    color: "#003824",
                    boxShadow: "0 8px 24px rgba(78, 222, 163, 0.2)",
                  }}
                >
                  Get Early Access
                </a>
              </div>
            </BetaGate>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-8 py-24" style={{ backgroundColor: "var(--surface)" }}>
          <div className="mx-auto max-w-3xl space-y-8">
            <h2
              className="text-center text-3xl font-bold sm:text-4xl"
              style={{ fontFamily: "var(--font-grotesk)" }}
            >
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {[
                {
                  q: "Can I cancel anytime?",
                  a: "Yes! Cancel anytime from your account settings. If you cancel mid-month, you'll keep Pro access until the end of your billing period. No penalties, no hassle.",
                },
                {
                  q: "Do you store my credit card numbers?",
                  a: "No. We only track card metadata — bank name, application dates, cancellation dates, and your notes. We never store or see your actual credit card numbers or PINs.",
                },
                {
                  q: "What's the 12-month rule?",
                  a: "Most Australian banks require you to wait 12 months after cancelling a card before you're eligible for sign-up bonuses on another card from that same bank. Reward Relay automatically tracks this for you.",
                },
                {
                  q: "Is my data secure?",
                  a: "Yes. Your data is encrypted in transit and at rest, stored in Australia, and protected by industry-standard security. We use Row Level Security so you can only access your own data.",
                },
              ].map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl transition-colors"
                  style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(27, 31, 44, 0.3)",
                  }}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between p-6 text-lg font-semibold text-white">
                    {faq.q}
                    <span
                      className="transition-transform group-open:rotate-180"
                      style={{ color: "var(--primary)" }}
                    >
                      ▼
                    </span>
                  </summary>
                  <p className="px-6 pb-6 text-sm" style={{ color: "var(--on-surface-variant)" }}>{faq.a}</p>
                </details>
              ))}

              <BetaGate>
                <details
                  className="group rounded-2xl transition-colors"
                  style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(27, 31, 44, 0.3)",
                  }}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between p-6 text-lg font-semibold text-white">
                    What happens after the 7-day free trial?
                    <span className="transition-transform group-open:rotate-180" style={{ color: "var(--primary)" }}>
                      ▼
                    </span>
                  </summary>
                  <p className="px-6 pb-6 text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    After 7 days, you&apos;ll be charged $9.99/month. You can cancel anytime before the
                    trial ends with no charge. No credit card tricks — just honest billing.
                  </p>
                </details>
              </BetaGate>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-background py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="font-headline text-2xl font-bold tracking-tighter text-[#4edea3]">
              Reward Relay
            </div>
            <p className="max-w-md text-sm" style={{ color: "var(--on-surface-variant)" }}>
              The Financial Luminary Command Center. Elevating credit reward management to high-stakes precision.
            </p>
          </div>
          <p className="tabular-nums text-xs" style={{ color: "#475569" }}>
            © 2024 Reward Relay. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
