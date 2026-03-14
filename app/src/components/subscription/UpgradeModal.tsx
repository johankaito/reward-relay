"use client"

import { X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  defaultTier?: 'pro' | 'business'
}

const FREE_FEATURES = [
  'Up to 3 cards tracked',
  'Basic P&L summary',
  'Card recommendations',
]

const PRO_FEATURES = [
  'Unlimited cards',
  'Full P&L history',
  'CSV export',
  'Annual fee tracking',
  'Spending tracker',
  'Email reminders',
]

const BUSINESS_FEATURES = [
  'Everything in Pro',
  'Business card flagging',
  'FBT exposure tracking',
  'ATO-ready PDF export',
  'Priority support SLA',
]

function FeatureList({ items, included }: { items: string[]; included: boolean }) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <Check
            className={`mt-0.5 h-4 w-4 shrink-0 ${included ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}
          />
          <span className={included ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function UpgradeModal({ open, onClose, defaultTier = 'pro' }: UpgradeModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-3xl rounded-2xl p-6 shadow-2xl"
        style={{ background: 'var(--surface)' }}
      >
        <button
          className="absolute right-4 top-4 rounded-full p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-1 text-xl font-bold text-[var(--text-primary)]">Upgrade your plan</h2>
        <p className="mb-6 text-sm text-[var(--text-secondary)]">
          Choose the plan that fits your card strategy.
        </p>

        <div className="grid grid-cols-3 gap-4">
          {/* Free */}
          <div className="rounded-xl border border-[var(--border)] p-4">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Free</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">$0</p>
              <p className="text-xs text-[var(--text-secondary)]">forever</p>
            </div>
            <FeatureList items={FREE_FEATURES} included />
          </div>

          {/* Pro */}
          <div
            className="rounded-xl border-2 p-4"
            style={{ borderColor: defaultTier === 'pro' ? 'var(--accent)' : 'var(--border)' }}
          >
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Pro</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">$9.99</p>
              <p className="text-xs text-[var(--text-secondary)]">per month</p>
            </div>
            <FeatureList items={PRO_FEATURES} included />
            <Button
              className="mt-4 w-full text-white"
              size="sm"
              style={{ background: defaultTier === 'pro' ? 'var(--gradient-cta)' : undefined }}
              variant={defaultTier === 'pro' ? 'default' : 'outline'}
              onClick={() => { window.location.href = '/settings#upgrade' }}
            >
              Get Pro
            </Button>
          </div>

          {/* Business */}
          <div
            className="rounded-xl border-2 p-4"
            style={{ borderColor: defaultTier === 'business' ? 'var(--accent)' : 'var(--border)' }}
          >
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Business</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">$19.99</p>
              <p className="text-xs text-[var(--text-secondary)]">per month</p>
            </div>
            <FeatureList items={BUSINESS_FEATURES} included />
            <Button
              className="mt-4 w-full text-white"
              size="sm"
              style={{ background: defaultTier === 'business' ? 'var(--gradient-cta)' : undefined }}
              variant={defaultTier === 'business' ? 'default' : 'outline'}
              onClick={() => { window.location.href = '/settings#upgrade-business' }}
            >
              Get Business
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
