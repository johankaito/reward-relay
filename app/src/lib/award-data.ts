import { supabase } from '@/lib/supabase/client'

export interface DataFreshness {
  tableName: string
  lastUpdated: string | null
  daysSinceUpdate: number | null
  status: 'fresh' | 'stale' | 'outdated' | 'unknown'
}

interface DataFreshnessRow {
  table_name: string | null
  last_updated: string | null
  days_since_update: number | null
}

const STALE_THRESHOLD_DAYS = 180
const OUTDATED_THRESHOLD_DAYS = 365

function classifyFreshness(daysSinceUpdate: number | null): DataFreshness['status'] {
  if (daysSinceUpdate === null) return 'unknown'
  if (daysSinceUpdate > OUTDATED_THRESHOLD_DAYS) return 'outdated'
  if (daysSinceUpdate > STALE_THRESHOLD_DAYS) return 'stale'
  return 'fresh'
}

export async function getAwardDataFreshness(): Promise<DataFreshness[]> {
  const { data, error } = await supabase
    .from('award_data_freshness' as never)
    .select('table_name, last_updated, days_since_update')

  if (error || !data) return []

  return (data as DataFreshnessRow[]).map((row) => ({
    tableName: row.table_name ?? '',
    lastUpdated: row.last_updated,
    daysSinceUpdate: row.days_since_update,
    status: classifyFreshness(row.days_since_update),
  }))
}
