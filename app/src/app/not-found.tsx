import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "#0b1326" }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4edea3] mb-4">404</p>
      <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
        Page not found
      </h1>
      <p className="text-on-surface-variant text-lg max-w-md mb-10 leading-relaxed">
        This route doesn&apos;t exist. Head back to your dashboard to keep tracking.
      </p>
      <Link
        href="/dashboard"
        className="rounded-full px-8 py-4 font-bold text-sm text-black shadow-lg shadow-[#4edea3]/20 transition-all hover:scale-[1.02]"
        style={{ background: "linear-gradient(135deg, #4edea3 0%, #10b981 100%)" }}
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
