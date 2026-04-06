export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex flex-col text-white min-h-screen overflow-hidden">
      {/* Fixed gradient background covering full viewport */}
      <div className="pointer-events-none fixed inset-0 -z-20 bg-background"></div>

      {/* Subtle gradient orbs for depth */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/8 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-700/6 blur-3xl"></div>
      </div>

      {/* Page Content — full viewport height, centered */}
      <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
        {children}
      </main>

      {/* Disclaimer footer */}
      <footer className="relative z-10 pb-4 text-center">
        <p className="text-xs text-muted-foreground">
          Not financial advice &middot;{" "}
          <a href="/terms" className="underline-offset-2 hover:underline">
            Terms
          </a>
        </p>
      </footer>
    </div>
  )
}
