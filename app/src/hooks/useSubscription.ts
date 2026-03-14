"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface SubscriptionState {
  tier: 'free' | 'pro' | 'business'
  isPro: boolean
  isBusiness: boolean
  isLoading: boolean
}

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    tier: 'free',
    isPro: false,
    isBusiness: false,
    isLoading: true,
  })

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setState({ tier: 'free', isPro: false, isBusiness: false, isLoading: false })
        return
      }

      const meta = session.user.user_metadata as Record<string, unknown>
      const rawTier = meta?.subscription_tier as string | undefined
      const isProFlag = meta?.is_pro === true

      const isBusiness = rawTier === 'business'
      const isPro = isBusiness || isProFlag || rawTier === 'pro'
      const tier: 'free' | 'pro' | 'business' = isBusiness ? 'business' : isPro ? 'pro' : 'free'

      setState({ tier, isPro, isBusiness, isLoading: false })
    }

    void load()
  }, [])

  return state
}
