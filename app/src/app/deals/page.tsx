// MERGED: /deals consolidated into /insights.
// Deals functionality (getEligibleDeals, elevated offer detection) is preserved
// in git history and @/lib/deals. TODO: integrate as a "Deals" tab in /insights
// alongside the Net Profit view in a future sprint (DA epic).
import { redirect } from 'next/navigation'
export default function DealsPage() { redirect('/insights') }
