'use client'

export type CelebrationIntensity = 'light' | 'medium' | 'heavy'

const configs = {
  light: { particleCount: 50, spread: 60, origin: { y: 0.7 } },
  medium: { particleCount: 100, spread: 80, origin: { y: 0.6 } },
  heavy: { particleCount: 200, spread: 120, origin: { y: 0.5 } },
}

export async function triggerCelebration(intensity: CelebrationIntensity = 'medium') {
  const confetti = (await import('canvas-confetti')).default
  confetti(configs[intensity])
}
