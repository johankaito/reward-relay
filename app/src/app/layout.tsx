import type { Metadata, Viewport } from "next"
import { IBM_Plex_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { ConditionalFooter } from "@/components/ConditionalFooter"

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
})

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
})

const APP_URL = "https://www.rewardrelay.app"

export const metadata: Metadata = {
  title: "Reward Relay — maximize card rewards",
  description: "Track every Australian credit card, hit every bonus, never miss a cancel date. The churner's command centre.",
  metadataBase: new URL(APP_URL),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    url: APP_URL,
    title: "Reward Relay — maximize card rewards",
    description: "Track every Australian credit card, hit every bonus, never miss a cancel date.",
    siteName: "Reward Relay",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Reward Relay" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reward Relay — maximize card rewards",
    description: "Track every Australian credit card, hit every bonus, never miss a cancel date.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Reward Relay",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f131f" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Inline script: apply .dark class before paint to prevent flash */}
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${inter.variable} ${plexMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Providers>
          <div className="flex-1">{children}</div>
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  )
}
