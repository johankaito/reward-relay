import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not set. Email reminders will not work.");
}

// Use a placeholder during build time if API key is not set
export const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder_for_build");

export const FROM_EMAIL = "Reward Relay <noreply@rewardrelay.au>";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rewardrelay.au";