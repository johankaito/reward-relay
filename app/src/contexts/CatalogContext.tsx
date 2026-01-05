"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"

type CatalogCard = Database["public"]["Tables"]["cards"]["Row"]

interface CachedCatalog {
  cards: CatalogCard[]
  timestamp: number
}

interface CatalogContextType {
  catalogCards: CatalogCard[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearCache: () => void
}

const CACHE_KEY = "catalog_cards"
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

const CatalogContext = createContext<CatalogContextType | undefined>(undefined)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalogCards, setCatalogCards] = useState<CatalogCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCatalog = async (useCache = true): Promise<void> => {
    setLoading(true)
    setError(null)

    // Check cache first
    if (useCache) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const { cards, timestamp }: CachedCatalog = JSON.parse(cached)
          const age = Date.now() - timestamp
          if (age < CACHE_TTL) {
            setCatalogCards(cards)
            setLoading(false)
            return
          }
        }
      } catch (e) {
        // Cache read failed, continue to fetch
        console.warn("Cache read failed:", e)
      }
    }

    // Fetch from Supabase
    try {
      const { data, error: fetchError } = await supabase
        .from("cards")
        .select("*")
        .eq("is_active", true)
        .order("bank", { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      const cards = data || []
      setCatalogCards(cards)

      // Cache the result
      try {
        const cache: CachedCatalog = { cards, timestamp: Date.now() }
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache))
      } catch (e) {
        // Cache write failed, continue
        console.warn("Cache write failed:", e)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load catalog"
      setError(message)
      console.error("Failed to load catalog:", err)
    } finally {
      setLoading(false)
    }
  }

  const refetch = async () => {
    await loadCatalog(false) // Bypass cache
  }

  const clearCache = () => {
    try {
      sessionStorage.removeItem(CACHE_KEY)
    } catch (e) {
      console.warn("Failed to clear cache:", e)
    }
  }

  useEffect(() => {
    loadCatalog()
  }, [])

  return (
    <CatalogContext.Provider
      value={{
        catalogCards,
        loading,
        error,
        refetch,
        clearCache,
      }}
    >
      {children}
    </CatalogContext.Provider>
  )
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (context === undefined) {
    throw new Error("useCatalog must be used within a CatalogProvider")
  }
  return context
}
