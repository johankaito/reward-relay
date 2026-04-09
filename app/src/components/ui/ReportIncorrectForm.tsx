'use client'

import { useState } from 'react'

const FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: 'bonusPoints', label: 'Bonus Points' },
  { value: 'spendRequirement', label: 'Spend Requirement' },
  { value: 'annualFee', label: 'Annual Fee' },
  { value: 'earnRate', label: 'Earn Rate' },
  { value: 'other', label: 'Other' },
]

interface ReportIncorrectFormProps {
  cardId: string
}

type FormState = 'idle' | 'open' | 'submitting' | 'success'

export function ReportIncorrectForm({ cardId }: ReportIncorrectFormProps) {
  const [formState, setFormState] = useState<FormState>('idle')
  const [field, setField] = useState(FIELD_OPTIONS[0].value)
  const [correctValue, setCorrectValue] = useState('')
  const [note, setNote] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!correctValue.trim()) return

    setFormState('submitting')

    try {
      const res = await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          field,
          reportedValue: note.trim() ? `${correctValue.trim()} — ${note.trim()}` : correctValue.trim(),
        }),
      })

      if (res.ok) {
        setFormState('success')
        setTimeout(() => setFormState('idle'), 3000)
      } else {
        setFormState('open')
      }
    } catch {
      setFormState('open')
    }
  }

  if (formState === 'idle') {
    return (
      <button
        onClick={() => setFormState('open')}
        className="mt-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
      >
        Report incorrect info
      </button>
    )
  }

  if (formState === 'success') {
    return (
      <p className="mt-2 text-xs text-primary">
        Thanks — we&apos;ll review this.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-xl border border-white/10 bg-surface-container-low p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-on-surface-variant">Report incorrect info</p>
        <button
          type="button"
          onClick={() => setFormState('idle')}
          className="text-xs text-on-surface-variant hover:text-on-surface"
        >
          Cancel
        </button>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
          Field
        </label>
        <select
          value={field}
          onChange={(e) => setField(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-xs text-on-surface"
        >
          {FIELD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
          Correct value
        </label>
        <input
          type="text"
          value={correctValue}
          onChange={(e) => setCorrectValue(e.target.value)}
          placeholder="e.g. 80,000"
          required
          className="w-full rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/40"
        />
      </div>

      <div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any additional context?"
          rows={2}
          className="w-full rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/40 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={formState === 'submitting' || !correctValue.trim()}
          className="flex-1 rounded-lg py-2 text-xs font-semibold text-black disabled:opacity-50 transition-opacity"
          style={{ background: 'var(--gradient-cta)' }}
        >
          {formState === 'submitting' ? 'Submitting...' : 'Submit'}
        </button>
        <button
          type="button"
          onClick={() => setFormState('idle')}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
