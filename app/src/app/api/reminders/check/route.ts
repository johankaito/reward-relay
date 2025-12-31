import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/email/client";
import {
  get30DayReminderEmail,
  get14DayReminderEmail,
  get7DayReminderEmail,
} from "@/lib/email/templates";

// Use service role for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: Request) {
  try {
    // Verify authorization (optional: add API key check)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const remindersSent = {
      "30_day": 0,
      "14_day": 0,
      "7_day": 0,
    };

    // Get all active user cards
    const { data: cards, error } = await supabaseAdmin
      .from("user_cards")
      .select(`
        *,
        card:cards(*)
      `)
      .eq("status", "active")
      .not("cancellation_date", "is", null);

    if (error) throw error;

    const today = new Date();
    const promises: Promise<any>[] = [];

    for (const userCard of cards || []) {
      if (!userCard.cancellation_date) continue;

      const cancellationDate = new Date(userCard.cancellation_date);
      const daysUntilCancellation = Math.ceil(
        (cancellationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine which reminder to send
      let reminderType: "30_day" | "14_day" | "7_day" | null = null;
      let emailTemplate: any = null;

      if (daysUntilCancellation <= 7 && daysUntilCancellation > 0) {
        reminderType = "7_day";
        emailTemplate = get7DayReminderEmail;
      } else if (daysUntilCancellation <= 14 && daysUntilCancellation > 7) {
        reminderType = "14_day";
        emailTemplate = get14DayReminderEmail;
      } else if (daysUntilCancellation <= 30 && daysUntilCancellation > 14) {
        reminderType = "30_day";
        emailTemplate = get30DayReminderEmail;
      }

      if (!reminderType || !emailTemplate) continue;

      // Check if reminder already sent
      const { data: existingReminder } = await supabaseAdmin
        .from("email_reminders")
        .select("id")
        .eq("user_card_id", userCard.id)
        .eq("reminder_type", reminderType)
        .single();

      if (existingReminder) continue; // Already sent

      // Get user email
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
        userCard.user_id
      );

      if (!userData?.user?.email) continue;

      // Prepare email data
      const emailData = {
        cardName: userCard.card.name,
        bank: userCard.card.bank,
        cancellationDate: cancellationDate.toLocaleDateString("en-AU", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        daysRemaining: daysUntilCancellation,
        currentSpend: userCard.current_spend || 0,
        spendTarget: userCard.card.bonus_spend_requirement || 0,
        appUrl: APP_URL,
      };

      const email = emailTemplate(emailData);

      // Send email
      const sendPromise = resend.emails
        .send({
          from: FROM_EMAIL,
          to: userData.user.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
        })
        .then(async () => {
          // Log reminder sent
          await supabaseAdmin.from("email_reminders").insert({
            user_card_id: userCard.id,
            reminder_type: reminderType,
            email_to: userData.user!.email!,
          });

          remindersSent[reminderType as keyof typeof remindersSent]++;
        })
        .catch((error) => {
          console.error(`Failed to send ${reminderType} reminder:`, error);
        });

      promises.push(sendPromise);
    }

    // Wait for all emails to send
    await Promise.all(promises);

    return NextResponse.json({
      success: true,
      remindersSent,
      totalCards: cards?.length || 0,
    });
  } catch (error: any) {
    console.error("Error checking reminders:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}