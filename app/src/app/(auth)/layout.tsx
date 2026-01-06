import Header from "@/components/layout/Header"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#050810] text-white">
      {/* Subtle gradient orbs for depth */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"></div>
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
