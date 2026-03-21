export const BANK_GRADIENTS: Record<string, string> = {
  ANZ: "linear-gradient(135deg, #1c4fd8 0%, #0a2fa8 100%)",
  CommBank: "linear-gradient(135deg, #f5a623 0%, #e8830c 100%)",
  Westpac: "linear-gradient(135deg, #d0021b 0%, #9b0114 100%)",
  NAB: "linear-gradient(135deg, #e31837 0%, #b0102a 100%)",
  Amex: "linear-gradient(135deg, #b8862c 0%, #8a6218 100%)",
  HSBC: "linear-gradient(135deg, #db0011 0%, #a30009 100%)",
}

export const DEFAULT_GRADIENT = "linear-gradient(135deg, #4edea3 0%, #10b981 100%)"

export function getBankGradient(bank: string | null | undefined): string {
  if (!bank) return DEFAULT_GRADIENT
  return BANK_GRADIENTS[bank] ?? DEFAULT_GRADIENT
}
