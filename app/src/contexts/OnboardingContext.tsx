"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase/client"
import { getOnboardingProgress, type OnboardingProgress } from "@/lib/onboarding"

type OnboardingContextValue = {
  progress: OnboardingProgress | null
  loading: boolean
  refresh: () => void
}

const OnboardingContext = createContext<OnboardingContextValue>({
  progress: null,
  loading: true,
  refresh: () => {},
})

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const p = await getOnboardingProgress(user.id)
    setProgress(p)
    setLoading(false)
  }

  useEffect(() => {
    load()

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") load()
      if (event === "SIGNED_OUT") {
        setProgress(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <OnboardingContext.Provider value={{ progress, loading, refresh: load }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  return useContext(OnboardingContext)
}
