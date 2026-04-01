// Keys are lowercase for case-insensitive matching
const BANK_GRADIENTS_LOWER: Record<string, string> = {
  // ANZ
  anz: "linear-gradient(135deg, #1c4fd8 0%, #0a2fa8 100%)",
  // CommBank / CBA
  commbank: "linear-gradient(135deg, #f5a623 0%, #e8830c 100%)",
  cba: "linear-gradient(135deg, #f5a623 0%, #e8830c 100%)",
  // Westpac
  westpac: "linear-gradient(135deg, #d0021b 0%, #9b0114 100%)",
  // NAB
  nab: "linear-gradient(135deg, #e31837 0%, #b0102a 100%)",
  // American Express / Amex
  amex: "linear-gradient(135deg, #2e77bc 0%, #1a4f8a 100%)",
  "american express": "linear-gradient(135deg, #2e77bc 0%, #1a4f8a 100%)",
  // HSBC
  hsbc: "linear-gradient(135deg, #db0011 0%, #a30009 100%)",
  // Bendigo Bank
  "bendigo bank": "linear-gradient(135deg, #c41230 0%, #8c0d22 100%)",
  bendigo: "linear-gradient(135deg, #c41230 0%, #8c0d22 100%)",
  // Bankwest
  bankwest: "linear-gradient(135deg, #009fdf 0%, #006ea8 100%)",
  // Citi
  citi: "linear-gradient(135deg, #056dae 0%, #034d80 100%)",
  // Macquarie
  macquarie: "linear-gradient(135deg, #2c2c2c 0%, #111111 100%)",
  // St.George
  "st.george": "linear-gradient(135deg, #00a651 0%, #007a3a 100%)",
  stgeorge: "linear-gradient(135deg, #00a651 0%, #007a3a 100%)",
  // Virgin Money
  "virgin money": "linear-gradient(135deg, #cf0a2c 0%, #9b081f 100%)",
  virgin: "linear-gradient(135deg, #cf0a2c 0%, #9b081f 100%)",
  // Qantas
  qantas: "linear-gradient(135deg, #e20008 0%, #a80006 100%)",
}

export const DEFAULT_GRADIENT = "linear-gradient(135deg, #4edea3 0%, #10b981 100%)"

export function getBankGradient(bank: string | null | undefined): string {
  if (!bank) return DEFAULT_GRADIENT
  const key = bank.trim().toLowerCase()
  return BANK_GRADIENTS_LOWER[key] ?? DEFAULT_GRADIENT
}

// Keep named export for any direct consumers
export const BANK_GRADIENTS = BANK_GRADIENTS_LOWER
