import type { SiteContent } from "@/lib/content/schema";
import type { Appointment, Payment, Reminder } from "@/lib/domain";

type Settings = SiteContent["reminders"];

export type ReminderPlan = { create: Omit<Reminder, "id">[]; cancel: string[] };

/** 09:00 local-ish (UTC+1) on the day `days` before `date` (YYYY-MM-DD). */
export function paymentReminderTime(dueDate: string, days: number): string {
  const d = new Date(`${dueDate}T08:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

/**
 * Pure planning of automatic reminders: one per pending payment and (optionally) one per upcoming
 * appointment, identified by `sourceId` so they are never duplicated. Reminders whose source was
 * paid, cancelled or deleted are cancelled. Manual reminders (sourceId null) are never touched.
 */
export function planAutoReminders(
  settings: Settings,
  payments: Payment[],
  appointments: Appointment[],
  existing: Reminder[],
  now: Date,
): ReminderPlan {
  const plan: ReminderPlan = { create: [], cancel: [] };
  const bySource = new Map(existing.filter((r) => r.sourceId).map((r) => [r.sourceId!, r]));
  const wanted = new Set<string>();
  const base = {
    toStudent: settings.notifyStudents,
    toGuardians: settings.notifyGuardians,
    byEmail: settings.emailChannel,
    status: "scheduled" as const,
    sentAt: null,
    deliveryLog: "",
  };

  if (settings.autoPayment) {
    for (const p of payments) {
      if (p.status !== "pending" || !p.dueDate) continue;
      if (new Date(`${p.dueDate}T23:59:59Z`) < now) continue;
      wanted.add(p.id);
      if (bySource.has(p.id)) continue;
      plan.create.push({
        ...base,
        studentId: p.studentId,
        kind: "payment",
        message: `Promemoria: scadenza «${p.label}» il ${formatDay(p.dueDate)}.`,
        sendAt: paymentReminderTime(p.dueDate, settings.paymentDaysBefore),
        sourceId: p.id,
      });
    }
  }

  if (settings.autoLesson) {
    for (const a of appointments) {
      const start = new Date(a.startsAt);
      if (start < now) continue;
      wanted.add(a.id);
      if (bySource.has(a.id)) continue;
      plan.create.push({
        ...base,
        studentId: a.studentId,
        kind: "lesson",
        message: `Promemoria: «${a.title}» il ${formatDateTime(a.startsAt)}.`,
        sendAt: new Date(start.getTime() - settings.lessonHoursBefore * 3600_000).toISOString(),
        sourceId: a.id,
      });
    }
  }

  for (const [sourceId, r] of bySource) {
    if (r.status === "scheduled" && !wanted.has(sourceId)) plan.cancel.push(r.id);
  }
  return plan;
}

export function dueReminders(reminders: Reminder[], now: Date): Reminder[] {
  return reminders.filter((r) => r.status === "scheduled" && new Date(r.sendAt) <= now);
}

export function formatDay(isoDate: string, locale = "it-IT"): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${isoDate.slice(0, 10)}T12:00:00Z`),
  );
}

export function formatDateTime(iso: string, locale = "it-IT"): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  }).format(new Date(iso));
}
