'use client'

import { useState } from 'react'

interface Correction {
  id: string
  card_id: string | null
  field: string
  reported_value: string
  reported_by: string | null
  status: 'pending' | 'verified' | 'dismissed' | null
  created_at: string | null
  cardName: string
  cardBank: string
}

interface CorrectionsTableProps {
  corrections: Correction[]
}

export function CorrectionsTable({ corrections }: CorrectionsTableProps) {
  const [statuses, setStatuses] = useState<Record<string, 'verified' | 'dismissed' | 'pending'>>(
    Object.fromEntries(corrections.map((c) => [c.id, 'pending']))
  )
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const visible = corrections.filter((c) => statuses[c.id] === 'pending')

  if (corrections.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        No pending corrections.
      </p>
    )
  }

  async function handleAction(correctionId: string, action: 'verified' | 'dismissed') {
    setLoading((prev) => ({ ...prev, [correctionId]: true }))
    setErrors((prev) => ({ ...prev, [correctionId]: '' }))

    try {
      const res = await fetch(`/api/corrections/${correctionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
      }

      setStatuses((prev) => ({ ...prev, [correctionId]: action }))
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [correctionId]: err instanceof Error ? err.message : 'Unknown error',
      }))
    } finally {
      setLoading((prev) => ({ ...prev, [correctionId]: false }))
    }
  }

  return (
    <>
      {visible.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          All corrections resolved for this session.
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
              {['Card', 'Bank', 'Field', 'Reported Value', 'Reported By', 'Date', 'Actions'].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '0.5rem',
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {visible.map((correction) => (
              <tr
                key={correction.id}
                style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}
              >
                <td style={{ padding: '0.5rem', color: 'var(--text-primary)' }}>
                  {correction.cardName}
                </td>
                <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                  {correction.cardBank}
                </td>
                <td style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {correction.field}
                </td>
                <td style={{ padding: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {correction.reported_value}
                </td>
                <td style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  {correction.reported_by ? correction.reported_by.slice(0, 8) + '…' : '—'}
                </td>
                <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                  {correction.created_at
                    ? new Date(correction.created_at).toLocaleDateString('en-AU')
                    : '—'}
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => handleAction(correction.id, 'verified')}
                      disabled={loading[correction.id]}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        background: '#16a34a',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: loading[correction.id] ? 'not-allowed' : 'pointer',
                        opacity: loading[correction.id] ? 0.6 : 1,
                      }}
                    >
                      {loading[correction.id] ? '…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(correction.id, 'dismissed')}
                      disabled={loading[correction.id]}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        border: '1px solid var(--border, #e5e7eb)',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: loading[correction.id] ? 'not-allowed' : 'pointer',
                        opacity: loading[correction.id] ? 0.6 : 1,
                      }}
                    >
                      Dismiss
                    </button>
                    {errors[correction.id] && (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                        {errors[correction.id]}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
