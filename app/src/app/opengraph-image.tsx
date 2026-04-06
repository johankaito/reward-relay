import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Reward Relay — maximize card rewards"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#0b1326",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            width: 64,
            height: 4,
            borderRadius: 9999,
            background: "linear-gradient(135deg, #4edea3, #10b981)",
            marginBottom: 32,
          }}
        />

        {/* Headline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: 24,
          }}
        >
          Track every card.
          <br />
          Hit every goal.
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            fontWeight: 400,
            marginBottom: 48,
          }}
        >
          The churner&apos;s command centre for Australian credit cards.
        </div>

        {/* Brand pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(78,222,163,0.12)",
            border: "1px solid rgba(78,222,163,0.3)",
            borderRadius: 9999,
            padding: "12px 28px",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#4edea3",
            }}
          />
          <span style={{ color: "#4edea3", fontSize: 20, fontWeight: 700, letterSpacing: "0.1em" }}>
            REWARD RELAY
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
