"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Lock,
  Check,
} from "lucide-react"
import Header from "@/components/layout/Header"
import { supabase } from "@/lib/supabase/client"

import { BetaGate } from "@/components/ui/BetaGate"
import { BetaOnly } from "@/components/ui/BetaOnly"
import { BetaRequestForm } from "@/components/forms/BetaRequestForm"

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard")
      } else {
        setIsLoggedIn(false)
      }
    })
  }, [router])

  return (
    <div
      className="relative flex flex-col text-white"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Background glow blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute left-[-10%] top-[10%] h-[600px] w-[600px] rounded-full blur-[120px]"
          style={{ background: "rgba(78, 222, 163, 0.10)" }}
        />
        <div
          className="absolute bottom-[10%] right-[-10%] h-[600px] w-[600px] rounded-full blur-[120px]"
          style={{ background: "rgba(208, 188, 255, 0.05)" }}
        />
      </div>

      <Header logoClickable={false} />

      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="relative flex min-h-[800px] items-center justify-center overflow-hidden px-6 py-20 md:px-20 md:py-28">
          {/* Ambient green glow — centered radial behind headline + left edge bleed */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Centered hero glow — primary focal point */}
            <div
              className="absolute left-1/2 top-1/2 h-[800px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
              style={{ background: "rgba(78, 222, 163, 0.09)" }}
            />
            {/* Left edge bleed */}
            <div
              className="absolute -left-40 top-1/2 h-[700px] w-[700px] -translate-y-1/2 rounded-full blur-[130px]"
              style={{ background: "rgba(78, 222, 163, 0.06)" }}
            />
          </div>
          <div className="relative z-10 mx-auto max-w-5xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(78, 222, 163, 0.1)", color: "var(--primary)" }}>
              Know When to Apply
            </div>

            {/* Headline */}
            <h1 className="mb-6 font-headline text-5xl font-extrabold leading-[1.1] tracking-tight text-on-surface md:text-7xl">
              Master the{" "}
              <span className="text-[#10b981]">Churn</span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed md:text-xl"
              style={{ color: "var(--on-surface-variant)" }}>
              Know exactly when you&apos;re eligible for your next rewards card. Track your card history, see your cooling-off windows, and never miss an application opportunity. Free forever for the essentials.
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
                  href="/login?access=1"
                  className="bg-primary-gradient w-full rounded-full px-10 py-4 text-lg font-bold text-on-primary shadow-lg shadow-[#4edea3]/20 transition-transform hover:scale-105 md:w-auto"
                >
                  Start Tracking
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

            {/* Trusted By strip — inside hero, below CTAs */}
            <div className="mt-10 border-t border-white/5 pt-8">
              <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                Trusted by 5,000+ Aussie Points Hackers
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                {["AMEX", "QANTAS", "VELOCITY", "COMMBANK", "ANZ"].map((label) => (
                  <span
                    key={label}
                    className="text-[11px] font-bold tracking-[0.15em] text-on-surface-variant"
                  >
                    {label}
                  </span>
                ))}
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
            <div className="space-y-16">
              {[
                {
                  num: "1",
                  title: "Log Your Card History",
                  body: "Tell us which cards you've had and when. We calculate your bank cooling-off periods automatically.",
                },
                {
                  num: "2",
                  title: "See Your Eligibility Windows",
                  body: "Know exactly when you're eligible again for each bank. No more guessing or re-reading the PDS.",
                },
                {
                  num: "3",
                  title: "Get Your Next Card",
                  body: "We rank available cards by value, filtered to only what you can actually apply for right now.",
                },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-8">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#4edea3]/20 bg-[#4edea3]/10 text-2xl font-headline font-bold text-[#4edea3]">
                    {step.num}
                  </div>
                  <div className="pt-1">
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
                <svg className="h-full w-full -rotate-90" viewBox="0 0 256 256">
                  <circle cx="128" cy="128" r="110" fill="transparent" stroke="rgba(78,222,163,0.12)" strokeWidth="16" />
                  <circle
                    cx="128"
                    cy="128"
                    r="110"
                    fill="transparent"
                    stroke="#4edea3"
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
                  Card History & Eligibility
                </h3>
                <p className="max-w-md text-lg" style={{ color: "var(--on-surface-variant)" }}>
                  Your full card history in one place. See eligibility windows at a glance across every bank.
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

        {/* Pricing */}
        <BetaGate>
          <section className="px-8 py-24" style={{ backgroundColor: "var(--surface)" }}>
            <div className="mx-auto max-w-7xl space-y-8">
              <div className="space-y-3 text-center">
                <h2
                  className="text-3xl font-bold sm:text-4xl"
                  style={{ fontFamily: "var(--font-grotesk)" }}
                >
                  Start free. Upgrade when you need more.
                </h2>
                <p style={{ color: "var(--on-surface-variant)" }}>
                  The free tier watches your cards. Pro tells you what to do next.
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
                    <h3 className="mb-1 text-2xl font-bold" style={{ fontFamily: "var(--font-grotesk)" }}>
                      Lite Relay
                    </h3>
                    <p className="mb-3 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      The protection layer. Never miss a deadline or an unexpected fee.
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tabular-nums">$0</span>
                      <span style={{ color: "var(--on-surface-variant)" }}>/month</span>
                    </div>
                  </div>
                  <ul className="mb-10 flex-grow space-y-4">
                    {[
                      "Track up to 3 cards",
                      "Spend deadline alerts (30/14/7 day)",
                      "Annual fee renewal reminders",
                      "Bank eligibility countdown",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <span className="material-symbols-outlined text-[#4edea3] text-lg shrink-0" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>check_circle</span>
                        {f}
                      </li>
                    ))}
                    {["Unlimited card history", "Full card recommendations", "Profit & analytics dashboard"].map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm opacity-35">
                        <span className="material-symbols-outlined text-outline text-lg shrink-0">check_circle</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/login?access=1"
                    className="rounded-full py-4 text-center font-bold text-white transition-colors hover:bg-white/10"
                    style={{ border: "1px solid rgba(134, 148, 138, 0.5)" }}
                  >
                    Start Free — No card required
                  </a>
                </div>

                {/* Command Center */}
                <div
                  className="relative flex flex-col rounded-2xl p-10 shadow-2xl"
                  style={{
                    backgroundColor: "var(--surface-container-highest)",
                    border: "1px solid rgba(78,222,163,0.45)",
                    boxShadow: "0 0 20px rgba(78,222,163,0.15), 0 24px 48px rgba(0,0,0,0.4)",
                  }}
                >
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl"
                    style={{ background: "rgba(78,222,163,0.1)" }} />
                  <div
                    className="absolute left-1/2 -translate-x-1/2 -top-4 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: "linear-gradient(135deg, #3DFFA0 0%, #00C878 100%)", color: "#003824" }}
                  >
                    Most Popular
                  </div>
                  <div className="mb-8">
                    <h3 className="mb-1 text-2xl font-bold font-headline">
                      Command Center
                    </h3>
                    <p className="mb-3 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      The intelligence layer. Know your next move before you need to make it.
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tabular-nums">$29</span>
                      <span style={{ color: "var(--on-surface-variant)" }}>/month</span>
                    </div>
                  </div>
                  <ul className="mb-10 flex-grow space-y-4">
                    {[
                      "Everything in Free",
                      "Unlimited card history",
                      "Full personalised recommendations",
                      "Profit & P&L analytics",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <span className="material-symbols-outlined text-[#4edea3] text-lg shrink-0" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>check_circle</span>
                        <strong>{f}</strong>
                      </li>
                    ))}
                    {[
                      "Catalog bonus change alerts",
                      "Points Horizon goal tracker",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <span className="material-symbols-outlined text-[#4edea3] text-lg shrink-0" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>check_circle</span>
                        <strong>{f}</strong>
                        <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">Soon</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/login?access=1"
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
                  '"Finally I know exactly when to apply again. No more waiting 13 months only to find out I\'m still in the cooling-off period."',
                name: "Alex Chen",
                role: "Churning since 2019",
              },
              {
                quote:
                  '"It told me I was eligible for the ANZ Black 6 weeks before I\'d have figured it out myself. Already have the points in my account."',
                name: "Sarah Jenkins",
                role: "Points collector",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="relative rounded-2xl p-8 italic"
                style={{
                  background: "#1a1f2e",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--on-surface-variant)",
                }}
              >
                <span
                  className="absolute -top-6 left-4 leading-none select-none"
                  style={{ color: "#4edea3", fontSize: "80px", fontFamily: "Georgia, serif", lineHeight: 1 }}
                >
                  &#8220;
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
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-lg p-16">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px]"
              style={{ background: "rgba(78,222,163,0.05)" }}
            />
            <h2 className="mb-6 font-headline text-4xl font-extrabold md:text-5xl">
              Ready to Master the Churn?
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-lg" style={{ color: "var(--on-surface-variant)" }}>
              Stop guessing your eligibility. Join 5,000+ Aussies who know exactly when to apply for
              their next card.
            </p>
            <BetaOnly>
              <BetaRequestForm
                buttonText="Get Early Access"
                buttonClassName="px-12 py-4 bg-primary-gradient text-on-primary font-headline font-bold rounded-full hover:scale-105 transition-transform shadow-lg shadow-[#4edea3]/20"
                variant="inline"
              />
            </BetaOnly>
            <BetaGate>
              <div className="flex flex-col items-center justify-center gap-3 md:flex-row">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full md:w-72 h-14 px-5 rounded-full bg-surface-container border-none text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <a
                  href="/login"
                  className="w-full md:w-auto h-14 flex items-center justify-center rounded-full px-10 text-lg font-bold transition-all hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #3DFFA0 0%, #00C878 100%)",
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

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-background py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="font-headline text-2xl font-bold tracking-tighter text-[#4edea3]">
              Reward Relay
            </div>
            <p className="max-w-md text-sm" style={{ color: "var(--on-surface-variant)" }}>
              Know exactly when you&apos;re eligible for your next rewards card.
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
