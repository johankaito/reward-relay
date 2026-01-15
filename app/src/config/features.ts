/**
 * Feature Flags Configuration
 *
 * Toggle features globally across the application.
 * Update these flags to control visibility of features during different launch phases.
 */

export const FEATURE_FLAGS = {
  /**
   * Private Beta Mode
   *
   * When true:
   * - Hides all pricing information
   * - Shows "Private Beta - Invite Only" messaging
   * - Replaces signup CTAs with beta waitlist messaging
   *
   * When false:
   * - Shows full pricing section
   * - Hides beta/invite-only messaging
   * - Shows normal signup flow
   *
   * To launch publicly: Change this to `false` and redeploy
   */
  privateBeta: true,
} as const

export type FeatureFlags = typeof FEATURE_FLAGS
