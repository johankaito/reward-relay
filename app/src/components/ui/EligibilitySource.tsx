interface EligibilitySourceProps {
  officialTcUrl: string | null
  bankName: string
  unconfirmed: boolean
}

export function EligibilitySource({ officialTcUrl, bankName, unconfirmed }: EligibilitySourceProps) {
  if (unconfirmed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        Estimated — verify with {bankName} directly
      </span>
    )
  }

  if (officialTcUrl) {
    return (
      <a
        href={officialTcUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-full bg-teal-500/20 px-2 py-0.5 text-xs text-teal-400 hover:bg-teal-500/30 transition-colors"
      >
        Based on {bankName} T&Cs
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    )
  }

  return null
}
