import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { POINT_VALUATIONS } from '@/lib/pointValuations'
import type { ProfitCard } from '@/components/profit/CardBreakdown'
import type { FbtResult } from '@/lib/fbt'

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a2e',
    backgroundColor: '#ffffff',
  },
  coverPage: {
    padding: 48,
    fontFamily: 'Helvetica',
    backgroundColor: '#0f0f1a',
    color: '#ffffff',
    justifyContent: 'center',
  },
  h1: { fontSize: 24, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
  h2: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 12, color: '#3b82f6' },
  h3: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  subtitle: { fontSize: 11, marginBottom: 4, color: '#9ca3af' },
  body: { fontSize: 10, lineHeight: 1.6 },
  section: { marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#6b7280', fontSize: 9 },
  value: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  accent: { color: '#3b82f6' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginVertical: 10 },
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  col1: { flex: 2, fontSize: 9 },
  col2: { flex: 1.5, fontSize: 9, textAlign: 'right' },
  col3: { flex: 1, fontSize: 9, textAlign: 'right' },
  col4: { flex: 1, fontSize: 9, textAlign: 'right' },
  warning: {
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  warningText: { fontSize: 9, color: '#92400e' },
  success: {
    backgroundColor: '#d1fae5',
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  successText: { fontSize: 9, color: '#065f46' },
  disclaimer: { fontSize: 8, color: '#6b7280', lineHeight: 1.5 },
  pageNumber: {
    position: 'absolute',
    bottom: 24,
    right: 48,
    fontSize: 8,
    color: '#9ca3af',
  },
})

function fmtAud(n: number) {
  return `$${n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtPts(n: number) {
  return n.toLocaleString('en-AU')
}

export interface AnnualReportData {
  userEmail: string
  financialYear: string
  generatedAt: string
  allCards: ProfitCard[]
  fbtResults: FbtResult[]
}

export function AnnualReport({ data }: { data: AnnualReportData }) {
  const { userEmail, financialYear, generatedAt, allCards, fbtResults } = data

  const businessCards = allCards.filter((c) => c.is_business)
  const totalBonus = allCards.reduce((s, c) => s + c.bonusAud, 0)
  const totalFees = allCards.reduce((s, c) => s + c.fee, 0)
  const netProfit = totalBonus - totalFees

  return (
    <Document>
      {/* PAGE 1: Cover */}
      <Page size="A4" style={styles.coverPage}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={[styles.h1, { color: '#ffffff', marginBottom: 16 }]}>
            Reward Relay
          </Text>
          <Text style={[styles.h1, { fontSize: 18, color: '#3b82f6', marginBottom: 32 }]}>
            Annual Churning Report
          </Text>
          <Text style={[styles.subtitle, { marginBottom: 8 }]}>{userEmail}</Text>
          <Text style={[styles.subtitle, { marginBottom: 8 }]}>Financial Year: {financialYear}</Text>
          <Text style={styles.subtitle}>Generated: {generatedAt}</Text>
        </View>
        <Text style={[styles.disclaimer, { color: '#6b7280' }]}>
          For record-keeping purposes only. Not financial or tax advice.
        </Text>
      </Page>

      {/* PAGE 2: Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.h2}>Summary</Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Total bonuses earned</Text>
            <Text style={[styles.value, styles.accent]}>{fmtAud(totalBonus)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total annual fees paid</Text>
            <Text style={styles.value}>{fmtAud(totalFees)}</Text>
          </View>
          <View style={[styles.row, { marginTop: 6 }]}>
            <Text style={[styles.label, { fontFamily: 'Helvetica-Bold' }]}>Net profit</Text>
            <Text style={[styles.value, { fontSize: 13, color: netProfit >= 0 ? '#22c55e' : '#ef4444' }]}>
              {fmtAud(netProfit)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Cards tracked</Text>
            <Text style={styles.value}>{allCards.length}</Text>
          </View>
          {businessCards.length > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Business cards</Text>
              <Text style={styles.value}>{businessCards.length}</Text>
            </View>
          )}
        </View>
        <Text style={styles.pageNumber}>2</Text>
      </Page>

      {/* PAGE 3: Card-by-card P&L */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.h2}>Card-by-Card P&L</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.col1, { fontFamily: 'Helvetica-Bold' }]}>Card</Text>
              <Text style={[styles.col2, { fontFamily: 'Helvetica-Bold' }]}>Program</Text>
              <Text style={[styles.col3, { fontFamily: 'Helvetica-Bold' }]}>Bonus AUD</Text>
              <Text style={[styles.col4, { fontFamily: 'Helvetica-Bold' }]}>Net</Text>
            </View>
            {allCards.map((card) => (
              <View key={card.id} style={styles.tableRow}>
                <Text style={styles.col1}>{card.bank} {card.name}{card.is_business ? ' (B)' : ''}</Text>
                <Text style={styles.col2}>{card.pointsProgram}</Text>
                <Text style={styles.col3}>{fmtAud(card.bonusAud)}</Text>
                <Text style={[styles.col4, { color: card.netValue >= 0 ? '#22c55e' : '#ef4444' }]}>
                  {fmtAud(card.netValue)}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[styles.label, { marginTop: 6 }]}>(B) = Business card</Text>
        </View>
        <Text style={styles.pageNumber}>3</Text>
      </Page>

      {/* PAGE 4: Business card P&L + FBT (conditional) */}
      {businessCards.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.h2}>Business Card P&L</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.col1, { fontFamily: 'Helvetica-Bold' }]}>Card</Text>
                <Text style={[styles.col2, { fontFamily: 'Helvetica-Bold' }]}>Pts Earned</Text>
                <Text style={[styles.col3, { fontFamily: 'Helvetica-Bold' }]}>Bonus AUD</Text>
                <Text style={[styles.col4, { fontFamily: 'Helvetica-Bold' }]}>Net</Text>
              </View>
              {businessCards.map((card) => (
                <View key={card.id} style={styles.tableRow}>
                  <Text style={styles.col1}>{card.bank} {card.name}</Text>
                  <Text style={styles.col2}>{fmtPts(card.welcomeBonusPoints)}</Text>
                  <Text style={styles.col3}>{fmtAud(card.bonusAud)}</Text>
                  <Text style={[styles.col4, { color: card.netValue >= 0 ? '#22c55e' : '#ef4444' }]}>
                    {fmtAud(card.netValue)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {fbtResults.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.h3}>FBT Exposure Indicators</Text>
              {fbtResults.map((result) => (
                <View key={result.fbtYear} style={result.thresholdExceeded ? styles.warning : styles.success}>
                  <Text style={result.thresholdExceeded ? styles.warningText : styles.successText}>
                    {result.fbtYear}: {fmtPts(result.totalBusinessPoints)} pts (~{fmtAud(result.totalBusinessAud)})
                    {result.thresholdExceeded
                      ? ` — EXCEEDS 250,000-point threshold. Indicative exposure: ~${fmtAud(result.estimatedFbtLiability)}`
                      : ' — Under 250,000-point threshold'}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.pageNumber}>4</Text>
        </Page>
      )}

      {/* PAGE 5: Disclaimer */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.h2}>Important Disclaimers</Text>
          <View style={styles.divider} />
          <Text style={[styles.body, { marginBottom: 12 }]}>
            This report is generated for personal record-keeping purposes only and does not constitute
            financial, taxation, or legal advice. The figures contained in this report are estimates
            based on indicative point valuations sourced from the Australian Frequent Flyer community.
          </Text>
          <Text style={[styles.body, { marginBottom: 12 }]}>
            For FBT (Fringe Benefits Tax) obligations, consult a registered tax agent or the
            Australian Taxation Office (ATO) directly. The 250,000-point threshold referenced in
            this report is an indicative guideline only — actual FBT obligations depend on your
            specific circumstances.
          </Text>
          <Text style={[styles.h3, { marginTop: 8 }]}>Point Valuations Used</Text>
          {Object.entries(POINT_VALUATIONS).map(([program, rate]) => (
            <View key={program} style={styles.row}>
              <Text style={styles.label}>{program}</Text>
              <Text style={styles.value}>{(rate * 100).toFixed(1)}c per point</Text>
            </View>
          ))}
        </View>
        <Text style={styles.pageNumber}>{businessCards.length > 0 ? '5' : '4'}</Text>
      </Page>
    </Document>
  )
}
