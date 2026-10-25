import { runReminders } from "@/server/reminders";

/**
 * Called by Vercel Cron (see vercel.json) with "Authorization: Bearer $CRON_SECRET".
 * Creates automatic reminders and delivers the due ones.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Non autorizzato", { status: 401 });
  return Response.json(await runReminders());
}
