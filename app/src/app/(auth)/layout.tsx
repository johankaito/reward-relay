import Header from "@/components/layout/Header"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex flex-col h-full text-white">
      {/* Fixed gradient background covering full viewport */}
      <div className="pointer-events-none fixed inset-0 -z-20 bg-gradient-to-br from-background via-background to-background"></div>

      {/* Subtle gradient orbs for depth */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/8 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-700/6 blur-3xl"></div>
      </div>

      {/* Sticky Header */}
      <Header logoClickable={true} />

      {/* Page Content */}
      <main className="relative z-10 flex items-center justify-center flex-1 py-8 md:py-16">
        {children}
      </main>
    </div>
  )
}
