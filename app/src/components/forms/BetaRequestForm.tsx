"use client"

import { useState } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"

interface BetaRequestFormProps {
  /** Text for the trigger button */
  buttonText?: string
  /** Additional CSS classes for the trigger button */
  buttonClassName?: string
  /** Whether to show as inline form or modal-style */
  variant?: "inline" | "modal"
  /** Subtitle text below the button */
  subtitle?: string
}

export function BetaRequestForm({
  buttonText = "Request Beta Access",
  buttonClassName = "inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-105 hover:bg-teal-500 hover:shadow-xl hover:shadow-teal-500/30",
  variant = "inline",
  subtitle = "Limited spots available • Free during beta",
}: BetaRequestFormProps) {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleBetaRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    setLoading(true)

    try {
      // Direct insert to beta_requests table
      const { error } = await supabase.from("beta_requests").insert({
        email: email.trim(),
        name: name.trim() || null,
      })

      if (error) throw error

      // Success
      toast.success("Request submitted! We'll be in touch soon.")
      setShowForm(false)
      setEmail("")
      setName("")
    } catch (error: any) {
      console.error("Beta request error:", error)
      toast.error(error.message || "Failed to submit request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!showForm) {
    return (
      <>
        <button onClick={() => setShowForm(true)} className={buttonClassName}>
          {buttonText}
        </button>
        {subtitle && <p className="mt-3 text-sm text-slate-400">{subtitle}</p>}
      </>
    )
  }

  return (
    <form
      onSubmit={handleBetaRequest}
      className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white">
          Email address *
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-400 backdrop-blur-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white">
          Name (optional)
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-400 backdrop-blur-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-full bg-teal-600 px-6 py-2.5 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-105 hover:bg-teal-500 hover:shadow-xl hover:shadow-teal-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          disabled={loading}
          className="rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-slate-400">
        We'll review your request and send you an invite if accepted.
      </p>
    </form>
  )
}
