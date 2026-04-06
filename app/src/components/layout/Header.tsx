import Image from "next/image"
import Link from "next/link"
import { BetaGate } from "@/components/ui/BetaGate"

interface HeaderProps {
  /**
   * If true, logo clicks will navigate to home page
   * If false, logo is not clickable (for landing page)
   */
  logoClickable?: boolean
}

function LogoContent() {
  return (
    <>
      <Image src="/logo.png" alt="Reward Relay" width={32} height={32} className="drop-shadow-lg" />
      <span className="text-xl font-bold text-white">Reward Relay</span>
    </>
  )
}

export default function Header({ logoClickable = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-surface-container-lowest/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {logoClickable ? (
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <LogoContent />
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <LogoContent />
          </div>
        )}
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-2 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/5"
          >
            Log in
          </a>
          <BetaGate>
            <a
              href="/login?access=1"
              className="inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold transition-all hover:scale-105"
              style={{
                background: "var(--gradient-cta)",
                color: "var(--on-primary)",
                boxShadow: "0 4px 16px rgba(78, 222, 163, 0.25)",
              }}
            >
              Request Access
            </a>
          </BetaGate>
        </div>
      </div>
    </header>
  )
}
