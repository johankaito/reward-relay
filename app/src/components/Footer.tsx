export function Footer() {
  return (
    <footer className="border-t border-[var(--border-default)] bg-[var(--surface)] py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-[var(--text-secondary)] md:flex-row">
          <p>© {new Date().getFullYear()} Reward Relay. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-[var(--text-primary)] transition">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-[var(--text-primary)] transition">
              Terms of Service
            </a>
            <a href="/terms" className="hover:text-[var(--text-primary)] transition">
              Not financial advice
            </a>
            <a href="mailto:support@rewardrelay.com.au" className="hover:text-[var(--text-primary)] transition">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
