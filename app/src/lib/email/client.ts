import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not set. Email reminders will not work.");
}

export const resend = new Resend(process.env.RESEND_API_KEY || "");

export const FROM_EMAIL = "Reward Relay <noreply@rewardrelay.au>";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rewardrelay.au";