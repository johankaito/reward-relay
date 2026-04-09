"use client"
import type { HistoryCompleteness } from "@/lib/history-completeness"
import Link from "next/link"

interface Props {
  completeness: HistoryCompleteness
}

export function HistoryCompletenessCallout({ completeness }: Props) {
  if (completeness.level === "complete") return null

  let message: string
  if (completeness.missingCancellationDates.length > 0) {
    message = `${completeness.missingCancellationDates.length} cancelled card${completeness.missingCancellationDates.length === 1 ? "" : "s"} are missing cancellation dates — eligibility windows may be inaccurate.`
  } else if (completeness.missingDates.length > 0) {
    message = `${completeness.missingDates.length} card${completeness.missingDates.length === 1 ? "" : "s"} are missing application dates — eligibility windows may be inaccurate.`
  } else if (completeness.level === "empty") {
    message = "No card history found — add past cards so we can calculate your eligibility windows."
  } else {
    message = "Limited card history. Adding more past cards improves accuracy."
  }

  return (
    <div className="border-l-4 border-amber-500 bg-amber-500/5 px-4 py-3 rounded-r-xl text-sm text-amber-300 my-4">
      {message}{" "}
      <Link href="/cards/history" className="text-amber-400 underline">Fix this</Link>
    </div>
  )
}
