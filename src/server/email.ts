import "server-only";
import { isEmailConfigured } from "@/server/config";

export type Email = { to: string; subject: string; text: string; replyTo?: string };

/**
 * Transactional emails through Resend (https://resend.com). Without RESEND_API_KEY / EMAIL_FROM
 * (demo), emails are only written to the server log. Failures never break the user's flow.
 */
export async function sendEmail(email: Email): Promise<boolean> {
  if (!email.to) return false;
  if (!isEmailConfigured()) {
    console.info(`[email:demo] a ${email.to} — ${email.subject}\n${email.text}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error(`[email] invio non riuscito (${res.status}): ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] invio non riuscito", err);
    return false;
  }
}
