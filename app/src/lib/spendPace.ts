export type PaceStatus = 'on_track' | 'behind' | 'will_miss' | 'completed'

export interface PaceCalculation {
  daysTotal: number
  daysElapsed: number
  daysRemaining: number
  percentComplete: number
  avgDailySpend: number
  requiredDailySpend: number
  projectedTotal: number
  paceStatus: PaceStatus
}

export function calculatePace(
  currentSpend: number,
  requirement: number,
  applicationDate: string,
  deadline: string,
): PaceCalculation {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(applicationDate)
  start.setHours(0, 0, 0, 0)

  const end = new Date(deadline)
  end.setHours(0, 0, 0, 0)

  const MS_PER_DAY = 1000 * 60 * 60 * 24

  const daysTotal = Math.max(1, Math.round((end.getTime() - start.getTime()) / MS_PER_DAY))
  const daysElapsed = Math.max(1, Math.round((today.getTime() - start.getTime()) / MS_PER_DAY))
  const daysRemaining = Math.max(0, Math.round((end.getTime() - today.getTime()) / MS_PER_DAY))

  const percentComplete = Math.min(100, (currentSpend / requirement) * 100)
  const avgDailySpend = daysElapsed > 0 ? currentSpend / daysElapsed : 0
  const requiredDailySpend = daysRemaining > 0 ? (requirement - currentSpend) / daysRemaining : 0
  const projectedTotal = avgDailySpend * daysTotal

  let paceStatus: PaceStatus
  if (currentSpend >= requirement) {
    paceStatus = 'completed'
  } else if (daysRemaining === 0) {
    paceStatus = 'will_miss'
  } else if (projectedTotal >= requirement) {
    paceStatus = 'on_track'
  } else if (projectedTotal >= requirement * 0.8) {
    paceStatus = 'behind'
  } else {
    paceStatus = 'will_miss'
  }

  return {
    daysTotal,
    daysElapsed,
    daysRemaining,
    percentComplete,
    avgDailySpend,
    requiredDailySpend,
    projectedTotal,
    paceStatus,
  }
}
