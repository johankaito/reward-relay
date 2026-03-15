// National average monthly spending estimates (AUD) — based on ABS Household Expenditure Survey
export const NATIONAL_AVERAGE_SPEND = {
  groceries: 800,
  dining: 300,
  travel: 200,
  fuel: 150,
  other: 550,
} as const

export type SpendCategory = keyof typeof NATIONAL_AVERAGE_SPEND

export const SPEND_CATEGORY_LABELS: Record<SpendCategory, string> = {
  groceries: "Groceries",
  dining: "Dining Out",
  travel: "Travel",
  fuel: "Fuel",
  other: "Other",
}

export const SPEND_CATEGORY_RANGES: Record<SpendCategory, { min: number; max: number; step: number }> = {
  groceries: { min: 0, max: 2000, step: 50 },
  dining: { min: 0, max: 1000, step: 25 },
  travel: { min: 0, max: 3000, step: 50 },
  fuel: { min: 0, max: 600, step: 25 },
  other: { min: 0, max: 2000, step: 50 },
}
