import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#050810] text-white">
      {/* Subtle gradient orbs for depth */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"></div>
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0e1a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <Image src="/logo.svg" alt="Reward Relay" width={32} height={32} className="drop-shadow-lg" />
            <span className="text-xl font-bold text-white">Reward Relay</span>
          </a>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-2 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/5"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-teal-500/30"
            >
              Sign up
            </a>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center py-8 md:py-16">
        {children}
      </main>
    </div>
  )
}
