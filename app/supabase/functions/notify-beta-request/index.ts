import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

interface BetaRequest {
  id: string
  email: string
  name?: string
  message?: string
  created_at: string
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

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Reward Relay <noreply@rewardrelay.app>",
        to: ["support@rewardrelay.app"],
        subject: "New Beta Access Request",
        html: `
          <h2>New Beta Access Request</h2>
          <p><strong>Email:</strong> ${record.email}</p>
          ${record.name ? `<p><strong>Name:</strong> ${record.name}</p>` : ""}
          ${record.message ? `<p><strong>Message:</strong> ${record.message}</p>` : ""}
          <hr />
          <p style="color: #666; font-size: 12px;">
            Received at ${new Date(record.created_at).toLocaleString("en-AU", {
              timeZone: "Australia/Sydney"
            })}
          </p>
          <p style="color: #666; font-size: 12px;">
            Request ID: ${record.id}
          </p>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      console.error("Resend API error:", error)
      throw new Error(`Failed to send email: ${error}`)
    }

    const emailData = await emailResponse.json()
    console.log("Email sent successfully:", emailData)

    // Mark request as processed in database
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    const { error: updateError } = await supabase
      .from("beta_requests")
      .update({ processed: true })
      .eq("id", record.id)

    if (updateError) {
      console.error("Failed to mark as processed:", updateError)
      // Don't throw - email was sent successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailData.id,
        requestId: record.id
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error in notify-beta-request function:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
