import { ReactNode } from "react"
import { FEATURE_FLAGS } from "@/config/features"

type Props = {
  children: ReactNode
}

/**
 * BetaGate Component
 *
 * Shows children ONLY when NOT in private beta mode.
 * Use this to wrap pricing information and public launch features.
 *
 * When privateBeta = true: Children are hidden
 * When privateBeta = false: Children are shown
 */
export function BetaGate({ children }: Props) {
  if (FEATURE_FLAGS.privateBeta) {
    return null
  }

  return <>{children}</>
}
