import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const APP_URL = Deno.env.get("APP_URL") || "https://rewardrelay.app"

interface BetaRequest {
  id: string
  email: string
  name?: string
  approved: boolean
  invited_at?: string
}

Deno.serve(async (req) => {
  try {
    // Parse webhook payload from database trigger
    const payload = await req.json()
    console.log("Received webhook payload:", payload)

    // Extract beta request data from payload
    const record: BetaRequest = payload.record

    if (!record || !record.email) {
      console.error("Invalid payload: missing record or email")
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Only send welcome email if approved
    if (!record.approved) {
      console.log("Request not approved, skipping welcome email")
      return new Response(
        JSON.stringify({ message: "Request not approved, no email sent" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    const firstName = record.name ? record.name.split(" ")[0] : "there"

    // Send welcome email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Reward Relay <noreply@rewardrelay.app>",
        to: [record.email],
        subject: "Welcome to Reward Relay Beta!",
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0f172a; font-size: 28px; margin-bottom: 16px;">
              Welcome to Reward Relay, ${firstName}!
            </h1>

            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              You've been approved for beta access! We're excited to have you as one of our early users.
            </p>

            <div style="background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: white; font-size: 20px; margin: 0 0 16px 0;">
                Getting Started
              </h2>
              <a
                href="${APP_URL}/signup"
                style="display: inline-block; background: white; color: #0f172a; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; margin-top: 8px;"
              >
                Create Your Account
              </a>
            </div>

            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="color: #0f172a; font-size: 18px; margin: 0 0 12px 0;">
                What You Can Do:
              </h3>
              <ul style="color: #334155; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Track all your credit cards in one place</li>
                <li>Set churn targets and get notified</li>
                <li>Never miss a bonus opportunity</li>
                <li>Optimize your reward strategy</li>
              </ul>
            </div>

            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
              As a beta user, your feedback is invaluable. If you have any questions, suggestions, or issues,
              just reply to this email - we read every message!
            </p>

            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              Best,<br />
              The Reward Relay Team
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />

            <p style="color: #94a3b8; font-size: 12px;">
              Approved at ${new Date(record.invited_at || Date.now()).toLocaleString("en-AU", {
                timeZone: "Australia/Sydney"
              })}
            </p>
          </div>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      console.error("Resend API error:", error)
      throw new Error(`Failed to send email: ${error}`)
    }

    const emailData = await emailResponse.json()
    console.log("Welcome email sent successfully:", emailData)

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailData.id,
        requestId: record.id,
        recipient: record.email
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error in send-beta-welcome function:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
