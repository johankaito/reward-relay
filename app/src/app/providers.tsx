"use client"

import { ThemeProvider } from "next-themes"
import type { ReactNode } from "react"
import { Toaster } from "@/components/ui/sonner"
import { CatalogProvider } from "@/contexts/CatalogContext"
import { OnboardingProvider } from "@/contexts/OnboardingContext"
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider"

type Props = {
  children: ReactNode
}

export function Providers({ children }: Props) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AnalyticsProvider>
        <CatalogProvider>
          <OnboardingProvider>
            {children}
            <Toaster richColors position="top-right" />
          </OnboardingProvider>
        </CatalogProvider>
      </AnalyticsProvider>
    </ThemeProvider>
  )
}
