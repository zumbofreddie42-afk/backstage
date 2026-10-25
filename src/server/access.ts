import "server-only";
import type { Account, Student } from "@/lib/domain";
import { getStore } from "@/server/store";

/**
 * The single place that decides which students an account can see:
 * a student sees only their own profile, a guardian only the students linked to them.
 * Every page, action and file download of the student area goes through these helpers.
 */
export function visibleStudentIds(account: Account): string[] {
  if (!account.active) return [];
  if (account.role === "student") return account.studentId ? [account.studentId] : [];
  return [...new Set(account.guardianOf)];
}

export function canSeeStudent(account: Account, studentId: string | null | undefined): boolean {
  return Boolean(studentId) && visibleStudentIds(account).includes(studentId!);
}

export async function studentsFor(account: Account): Promise<Student[]> {
  const ids = visibleStudentIds(account);
  if (ids.length === 0) return [];
  return getStore().list("students", (s) => ids.includes(s.id) && s.active);
}

/** Resolves the student to show: the requested one if allowed, otherwise the first visible one. */
export async function pickStudent(account: Account, requested?: string): Promise<{ student: Student | null; all: Student[] }> {
  const all = await studentsFor(account);
  const student = (requested && all.find((s) => s.id === requested)) || all[0] || null;
  return { student, all };
}

/** Everything the dashboard shows, already filtered to one student. */
export async function dashboardData(studentId: string) {
  const store = getStore();
  const mine = <T extends { studentId: string | null }>(x: T) => x.studentId === studentId;
  const [lessons, progress, appointments, assignments, payments, reminders, certifications, shares] = await Promise.all([
    store.list("lessons", mine),
    store.list("progress", mine),
    store.list("appointments", mine),
    store.list("assignments", mine),
    store.list("payments", mine),
    store.list("reminders", mine),
    store.list("certifications", mine),
    store.list("shares", mine),
  ]);
  return {
    lessons: lessons.sort((a, b) => b.date.localeCompare(a.date)),
    progress: progress.sort((a, b) => b.date.localeCompare(a.date)),
    appointments: appointments.sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    assignments: assignments.sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")),
    payments: payments.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    reminders: reminders.filter((r) => r.status === "sent").sort((a, b) => b.sendAt.localeCompare(a.sendAt)),
    certifications: certifications.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    shares: shares.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

export function totalMinutes(lessons: { minutes: number }[]): number {
  return lessons.reduce((sum, l) => sum + l.minutes, 0);
}
