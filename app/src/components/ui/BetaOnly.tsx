import { ReactNode } from "react"
import { FEATURE_FLAGS } from "@/config/features"

type Props = {
  children: ReactNode
}

/**
 * BetaOnly Component
 *
 * Shows children ONLY when IN private beta mode.
 * Use this to wrap beta-specific messaging and invite-only content.
 *
 * When privateBeta = true: Children are shown
 * When privateBeta = false: Children are hidden
 */
export function BetaOnly({ children }: Props) {
  if (!FEATURE_FLAGS.privateBeta) {
    return null
  }

  return <>{children}</>
}
