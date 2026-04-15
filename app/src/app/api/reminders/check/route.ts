import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/email/client";
import {
  get30DayReminderEmail,
  get14DayReminderEmail,
  get7DayReminderEmail,
  getAnnualFee30DayReminderEmail,
  getAnnualFee14DayReminderEmail,
} from "@/lib/email/templates";

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Initialize Supabase client at request time to avoid build-time evaluation
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
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
      "annual_fee_30d": 0,
      "annual_fee_14d": 0,
    };

    // ── Cancellation reminders (all tiers) ──────────────────────────────────
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
    const promises: Promise<unknown>[] = [];

    for (const userCard of cards || []) {
      if (!userCard.cancellation_date) continue;

      const cancellationDate = new Date(userCard.cancellation_date);
      const daysUntilCancellation = Math.ceil(
        (cancellationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine which reminder to send
      let reminderType: "30_day" | "14_day" | "7_day" | null = null;
      let emailTemplate: typeof get7DayReminderEmail | null = null;

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
        .maybeSingle();

      if (existingReminder) continue; // Already sent

      // Get user email + metadata
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
        userCard.user_id
      );

      if (!userData?.user?.email) continue;

      // User preference opt-out (tier check removed — all users get 30/14/7 cadence)
      const meta = (userData.user.user_metadata ?? {}) as Record<string, unknown>;
      const prefKey =
        reminderType === "30_day"
          ? "reminder_30d"
          : reminderType === "14_day"
          ? "reminder_14d"
          : "reminder_7d";
      if (meta[prefKey] === false) continue;

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

    // ── Annual fee renewal reminders (all tiers) ────────────────────────────
    const { data: annualFeeCards, error: annualFeeError } = await supabaseAdmin
      .from("user_cards")
      .select(`
        *,
        card:cards(*)
      `)
      .eq("status", "active")
      .not("application_date", "is", null);

    if (annualFeeError) throw annualFeeError;

    for (const userCard of annualFeeCards || []) {
      if (!userCard.application_date) continue;

      // Resolve annual fee: user_cards override takes precedence, then catalog
      const annualFee: number =
        (userCard.annual_fee ?? userCard.card?.annual_fee ?? 0) as number;
      if (annualFee <= 0) continue;

      // Renewal date = application_date + 12 months (anniversary)
      const applicationDate = new Date(userCard.application_date);
      const renewalDate = new Date(applicationDate);
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);

      // Advance renewal year until it's in the future
      while (renewalDate < today) {
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
      }

      const daysUntilRenewal = Math.ceil(
        (renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      let annualFeeReminderType: "annual_fee_30d" | "annual_fee_14d" | null = null;
      let annualFeeTemplate:
        | typeof getAnnualFee30DayReminderEmail
        | typeof getAnnualFee14DayReminderEmail
        | null = null;

      if (daysUntilRenewal <= 14 && daysUntilRenewal > 0) {
        annualFeeReminderType = "annual_fee_14d";
        annualFeeTemplate = getAnnualFee14DayReminderEmail;
      } else if (daysUntilRenewal <= 30 && daysUntilRenewal > 14) {
        annualFeeReminderType = "annual_fee_30d";
        annualFeeTemplate = getAnnualFee30DayReminderEmail;
      }

      if (!annualFeeReminderType || !annualFeeTemplate) continue;

      // Check if reminder already sent for this renewal cycle
      // Use the renewal year as part of the check to allow re-sending next year
      const renewalYear = renewalDate.getFullYear();
      const { data: existingAnnualReminder } = await supabaseAdmin
        .from("email_reminders")
        .select("id")
        .eq("user_card_id", userCard.id)
        .eq("reminder_type", `${annualFeeReminderType}_${renewalYear}`)
        .maybeSingle();

      if (existingAnnualReminder) continue; // Already sent for this cycle

      // Get user email
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
        userCard.user_id
      );

      if (!userData?.user?.email) continue;

      const renewalDateStr = renewalDate.toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const emailData = {
        cardName: (userCard.card?.name ?? userCard.name ?? "Card") as string,
        bank: (userCard.card?.bank ?? userCard.bank ?? "Bank") as string,
        annualFee,
        renewalDate: renewalDateStr,
        daysRemaining: daysUntilRenewal,
        appUrl: APP_URL,
      };

      const email = annualFeeTemplate(emailData);
      const reminderTypeWithYear = `${annualFeeReminderType}_${renewalYear}`;

      const sendPromise = resend.emails
        .send({
          from: FROM_EMAIL,
          to: userData.user.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
        })
        .then(async () => {
          await supabaseAdmin.from("email_reminders").insert({
            user_card_id: userCard.id,
            reminder_type: reminderTypeWithYear,
            email_to: userData.user!.email!,
          });

          remindersSent[annualFeeReminderType as keyof typeof remindersSent]++;
        })
        .catch((err) => {
          console.error(`Failed to send ${annualFeeReminderType} reminder:`, err);
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
  } catch (error: unknown) {
    console.error("Error checking reminders:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
