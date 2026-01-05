"use client"

import Link from "next/link"
import Image from "next/image"

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-default)] bg-[var(--surface)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Image src="/logo.svg" alt="Reward Relay" width={32} height={32} />
          <span className="text-sm font-semibold text-white">Reward Relay</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Log in
          </Link>
        </nav>
      </div>
    </header>
  )
}
