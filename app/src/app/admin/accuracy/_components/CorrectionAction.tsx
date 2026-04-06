"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function CorrectionAction({
  correctionId,
  action,
  label,
}: {
  correctionId: string
  action: "verified" | "dismissed"
  label: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await fetch(`/api/corrections/${correctionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const isApprove = action === "verified"
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: "0.25rem 0.625rem",
        fontSize: "0.75rem",
        fontWeight: 600,
        borderRadius: "0.375rem",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        background: isApprove ? "#4edea3" : "transparent",
        color: isApprove ? "#003824" : "var(--text-secondary)",
        outline: isApprove ? "none" : "1px solid var(--border, #e5e7eb)",
      }}
    >
      {loading ? "…" : label}
    </button>
  )
}
