import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { CorrectionAction } from './_components/CorrectionAction'
import type { Database } from '@/types/database.types'

const ADMIN_EMAIL = 'john.g.keto+rewardrelay@gmail.com'

export default async function AccuracyDashboardPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  const serviceSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch all data in parallel
  const [
    { data: recentLogs },
    { data: lowConfLogs },
    { data: weekLogs },
    { data: hashChanges },
    { data: pendingCorrections },
    { data: unmatchedDeals },
  ] = await Promise.all([
    serviceSupabase
      .from('extraction_log')
      .select('card_id, confidence_score, model_used, run_at, hash_changed')
      .gte('run_at', thirtyDaysAgo)
      .order('run_at', { ascending: false }),

    serviceSupabase
      .from('extraction_log')
      .select('card_id, confidence_score, run_at')
      .lt('confidence_score', 0.8)
      .gte('run_at', thirtyDaysAgo)
      .order('confidence_score', { ascending: true })
      .limit(20),

    serviceSupabase
      .from('extraction_log')
      .select('id')
      .gte('run_at', sevenDaysAgo),

    serviceSupabase
      .from('extraction_log')
      .select('id')
      .eq('hash_changed', true)
      .gte('run_at', thirtyDaysAgo),

    serviceSupabase
      .from('card_corrections')
      .select('id, card_id, field, reported_value, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50),

    serviceSupabase
      .from('unmatched_deals')
      .select('id, source, raw_title, extracted_issuer, extracted_card_name, bonus_points, source_url, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  // Fetch card names for low confidence logs + corrections
  const logCardIds = [...new Set((lowConfLogs ?? []).map((l) => l.card_id).filter((id): id is string => id !== null))]
  const correctionCardIds = [...new Set((pendingCorrections ?? []).map((c) => c.card_id).filter((id): id is string => id !== null))]
  const allCardIds = [...new Set([...logCardIds, ...correctionCardIds])]
  const { data: cardDetails } =
    allCardIds.length > 0
      ? await serviceSupabase.from('cards').select('id, name, bank').in('id', allCardIds)
      : { data: [] }

  const cardMap = Object.fromEntries((cardDetails ?? []).map((c) => [c.id, c]))

  const avgConfidence =
    recentLogs && recentLogs.length > 0
      ? recentLogs.reduce((sum, l) => sum + (l.confidence_score ?? 0), 0) / recentLogs.length
      : null

  const weekRunCount = weekLogs?.length ?? 0
  const monthRunCount = recentLogs?.length ?? 0
  const hashChangeCount = hashChanges?.length ?? 0
  const pendingCount = pendingCorrections?.length ?? 0
  const unmatchedCount = unmatchedDeals?.length ?? 0

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'inherit' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        Extraction Quality Dashboard
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>
        Last 30 days &bull; Admin only
      </p>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard
          label="Avg Confidence"
          value={avgConfidence !== null ? `${(avgConfidence * 100).toFixed(1)}%` : '—'}
          highlight={avgConfidence !== null && avgConfidence < 0.8}
        />
        <StatCard label="Runs This Week" value={String(weekRunCount)} />
        <StatCard label="Runs This Month" value={String(monthRunCount)} />
        <StatCard
          label="Data Changes Detected"
          value={String(hashChangeCount)}
          highlight={hashChangeCount > 0}
        />
        <StatCard
          label="Pending Corrections"
          value={String(pendingCount)}
          highlight={pendingCount > 0}
        />
        <StatCard
          label="Unmatched Deals"
          value={String(unmatchedCount)}
          highlight={unmatchedCount > 0}
        />
      </div>

      {/* Low Confidence Cards */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.125rem', marginBottom: '1rem' }}>
          Cards with Confidence &lt; 80%
        </h2>
        {!lowConfLogs || lowConfLogs.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            No low-confidence extractions in the last 30 days.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  Card
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  Bank
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  Confidence
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  Last Extracted
                </th>
              </tr>
            </thead>
            <tbody>
              {lowConfLogs.map((log, i) => {
                const card = log.card_id ? cardMap[log.card_id] : null
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                    <td style={{ padding: '0.5rem', color: 'var(--text-primary)' }}>
                      {card?.name ?? log.card_id ?? '—'}
                    </td>
                    <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                      {card?.bank ?? '—'}
                    </td>
                    <td style={{ padding: '0.5rem', color: '#ef4444', fontWeight: 600 }}>
                      {log.confidence_score !== null
                        ? `${(log.confidence_score * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                    <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                      {log.run_at ? new Date(log.run_at).toLocaleDateString('en-AU') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Unmatched Deals Queue */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.125rem', marginBottom: '1rem' }}>
          Unmatched Deal Feed Items ({unmatchedCount})
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
          Feed items that could not be fuzzy-matched to a card in the catalogue. Review and link manually.
        </p>
        {!unmatchedDeals || unmatchedDeals.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No unmatched deals.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                {['Source', 'Issuer', 'Card Name', 'Bonus Pts', 'URL', 'Date'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {unmatchedDeals.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                  <td style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{d.source}</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-primary)' }}>{d.extracted_issuer ?? '—'}</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-primary)' }}>{d.extracted_card_name ?? d.raw_title ?? '—'}</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {d.bonus_points !== null ? d.bonus_points.toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    {d.source_url
                      ? <a href={d.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Link</a>
                      : '—'}
                  </td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                    {d.created_at ? new Date(d.created_at).toLocaleDateString('en-AU') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Recent Runs Summary */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.125rem', marginBottom: '1rem' }}>
          Recent Extraction Runs
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {monthRunCount} extractions in the last 30 days
          {hashChangeCount > 0 && ` \u2022 ${hashChangeCount} data changes detected`}
        </p>
      </section>

      {/* Pending Corrections */}
      <section>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.125rem', marginBottom: '1rem' }}>
          Pending Corrections ({pendingCount})
        </h2>
        {!pendingCorrections || pendingCorrections.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            No pending corrections.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                {['Card', 'Bank', 'Field', 'Reported Value', 'Submitted', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingCorrections.map((c) => {
                const card = c.card_id ? cardMap[c.card_id] : null
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                    <td style={{ padding: '0.5rem', color: 'var(--text-primary)' }}>{card?.name ?? c.card_id ?? '—'}</td>
                    <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{card?.bank ?? '—'}</td>
                    <td style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{c.field}</td>
                    <td style={{ padding: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>{c.reported_value}</td>
                    <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('en-AU') : '—'}
                    </td>
                    <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      <CorrectionAction correctionId={c.id} action="verified" label="Approve" />
                      <CorrectionAction correctionId={c.id} action="dismissed" label="Dismiss" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      style={{
        background: 'var(--surface, #fff)',
        border: `1px solid ${highlight ? '#fca5a5' : 'var(--border, #e5e7eb)'}`,
        borderRadius: '0.5rem',
        padding: '1rem',
      }}
    >
      <p
        style={{
          margin: '0 0 0.25rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: 700,
          color: highlight ? '#ef4444' : 'var(--text-primary)',
        }}
      >
        {value}
      </p>
    </div>
  )
}
