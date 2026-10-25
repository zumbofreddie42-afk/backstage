import "server-only";
import { newId } from "@/lib/domain";
import { dueReminders, planAutoReminders } from "@/lib/reminders";
import { sendEmail } from "@/server/email";
import { getStore } from "@/server/store";

/**
 * Creates the automatic reminders and delivers the due ones. Delivery always means "visible in the
 * student area"; email is added only when the school enabled it and Resend is configured.
 * Called by /api/cron/reminders (Vercel Cron) and opportunistically when the panels are opened.
 */
export async function runReminders(now = new Date()): Promise<{ created: number; sent: number }> {
  const store = getStore();
  const content = await store.getContent();
  const [payments, appointments, existing] = await Promise.all([
    store.list("payments"),
    store.list("appointments"),
    store.list("reminders"),
  ]);
  const plan = planAutoReminders(content.reminders, payments, appointments, existing, now);
  for (const r of plan.create) await store.insert("reminders", { id: newId("rem"), ...r });
  for (const id of plan.cancel) await store.update("reminders", id, { status: "cancelled" });

  const due = dueReminders(await store.list("reminders"), now);
  for (const r of due) {
    // Mark first so a concurrent run cannot send twice.
    await store.update("reminders", r.id, { status: "sent", sentAt: now.toISOString() });
    const log: string[] = ["area riservata"];
    if (r.byEmail) {
      const accounts = await store.list(
        "accounts",
        (a) => a.active && ((r.toStudent && a.studentId === r.studentId) || (r.toGuardians && a.guardianOf.includes(r.studentId))),
      );
      for (const a of accounts) {
        const ok = await sendEmail({
          to: a.email,
          subject: "Promemoria da Backstage Languages",
          text: `${r.message}\n\nTrovi i dettagli nella tua area riservata.`,
        });
        log.push(`email ${a.email}: ${ok ? "inviata" : "non inviata"}`);
      }
    }
    await store.update("reminders", r.id, { deliveryLog: log.join(" · ") });
  }
  return { created: plan.create.length, sent: due.length };
}
