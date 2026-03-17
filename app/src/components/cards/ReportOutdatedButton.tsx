'use client'

import { useState } from 'react'

interface ReportOutdatedButtonProps {
  cardId: string
  cardName: string
}

const FIELD_OPTIONS = [
  { value: 'bonusPoints', label: 'Bonus Points' },
  { value: 'annualFee', label: 'Annual Fee' },
  { value: 'earnRate', label: 'Earn Rate' },
  { value: 'spendRequirement', label: 'Spend Requirement' },
  { value: 'other', label: 'Other' },
]

export function ReportOutdatedButton({ cardId, cardName }: ReportOutdatedButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [field, setField] = useState('')
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!field || !value.trim()) return

    setStatus('submitting')
    setErrorMsg('')

    try {
      const response = await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, field, reportedValue: value.trim() }),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error ?? 'Submission failed')
      }

      setStatus('success')
      setTimeout(() => {
        setIsOpen(false)
        setStatus('idle')
        setField('')
        setValue('')
      }, 3000)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (status === 'success') {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        Thanks &mdash; we&apos;ll verify and update within 24h
      </p>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-transparent border-0 text-sm text-[var(--text-secondary)] cursor-pointer underline p-0"
      >
        Report outdated info
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-xs">
      <p className="m-0 text-sm font-medium text-[var(--text-primary)]">
        Report outdated info for {cardName}
      </p>

      <select
        value={field}
        onChange={(e) => setField(e.target.value)}
        required
        className="px-2 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
      >
        <option value="">Which field is outdated?</option>
        {FIELD_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What's the correct value?"
        required
        className="px-2 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] text-sm"
      />

      {status === 'error' && (
        <p className="m-0 text-xs text-red-500">{errorMsg}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white border-0 cursor-pointer text-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? 'Sending...' : 'Submit'}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-3 py-1.5 rounded-md bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] cursor-pointer text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
