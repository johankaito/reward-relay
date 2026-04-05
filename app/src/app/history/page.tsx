// MERGED: Churn history view redirects to /cards.
// The card list on /cards shows all user cards (active + cancelled) and is the
// canonical location for card management. Churn-specific filtering (eligibility
// countdown, cancellation date) can be added to /cards as a filter in a future sprint.
// Full churn history implementation (320 lines) preserved in git history.
import { redirect } from 'next/navigation'
export default function ChurnHistoryPage() { redirect('/cards') }
