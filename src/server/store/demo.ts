import "server-only";
import type { Collections } from "@/lib/domain";
import { hashPassword } from "@/server/passwords";

/**
 * Fictional demo data for the preview (marked `demo: true`, never real students). Login with the
 * credentials in DEMO_LOGINS. In live mode demo records are dropped and demo logins refused.
 */
export const DEMO_PASSWORD = "demo-backstage";
export const DEMO_LOGINS = [
  { login: "studente@demo.backstage", label: { it: "Studentessa (scuola superiore)", en: "Student (secondary school)" } },
  { login: "leo.r", label: { it: "Bambino (young learners, senza email)", en: "Child (young learners, no email)" } },
  { login: "genitore@demo.backstage", label: { it: "Genitore di due studenti", en: "Parent of two students" } },
] as const;

/** Inserted last: the Supabase store checks it to know whether the demo data is already there. */
export const DEMO_MARKER_ACCOUNT = "acc_demo_marco";

function isoDate(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

function isoAt(daysFromToday: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function demoData(): { [K in keyof Collections]: Collections[K][] } {
  const now = new Date().toISOString();
  const hash = hashPassword(DEMO_PASSWORD);
  return {
    accounts: [
      {
        id: "acc_demo_student",
        role: "student",
        name: "Giulia (demo)",
        username: "giulia.r",
        email: "studente@demo.backstage",
        passwordHash: hash,
        mustChangePassword: false,
        active: true,
        studentId: "stu_demo_giulia",
        guardianOf: [],
        locale: "it",
        demo: true,
        createdAt: now,
        lastLoginAt: null,
      },
      {
        id: "acc_demo_parent",
        role: "guardian",
        name: "Genitore (demo)",
        username: "genitore.demo",
        email: "genitore@demo.backstage",
        passwordHash: hash,
        mustChangePassword: false,
        active: true,
        studentId: null,
        guardianOf: ["stu_demo_giulia", "stu_demo_leo"],
        locale: "it",
        demo: true,
        createdAt: now,
        lastLoginAt: null,
      },
      {
        id: "acc_demo_leo",
        role: "student",
        name: "Leo (demo)",
        username: "leo.r",
        email: "",
        passwordHash: hash,
        mustChangePassword: false,
        active: true,
        studentId: "stu_demo_leo",
        guardianOf: [],
        locale: "it",
        demo: true,
        createdAt: now,
        lastLoginAt: null,
      },
      {
        id: "acc_demo_marco",
        role: "student",
        name: "Marco (demo)",
        username: "marco.t",
        email: "",
        passwordHash: hash,
        mustChangePassword: false,
        active: true,
        studentId: "stu_demo_marco",
        guardianOf: [],
        locale: "it",
        demo: true,
        createdAt: now,
        lastLoginAt: null,
      },
    ],
    students: [
      {
        id: "stu_demo_giulia",
        displayName: "Giulia R. (demo)",
        ageBand: "high",
        level: "B1",
        minor: true,
        active: true,
        classroomCode: "demo-123",
        staffNotes: "Studentessa fittizia per la demo.",
        demo: true,
        createdAt: now,
      },
      {
        id: "stu_demo_leo",
        displayName: "Leo R. (demo)",
        ageBand: "young",
        level: "pre-A1",
        minor: true,
        active: true,
        staffNotes: "Bambino fittizio per la demo.",
        demo: true,
        createdAt: now,
      },
      {
        id: "stu_demo_marco",
        displayName: "Marco T. (demo)",
        ageBand: "adults",
        level: "A2",
        minor: false,
        active: true,
        staffNotes: "Adulto fittizio: serve a verificare che gli altri non vedano i suoi dati.",
        demo: true,
        createdAt: now,
      },
    ],
    lessons: [
      { id: "les_demo_1", studentId: "stu_demo_giulia", date: isoDate(-21), minutes: 60, topic: "Present perfect vs past simple", teacher: "Christina", note: "" },
      { id: "les_demo_2", studentId: "stu_demo_giulia", date: isoDate(-14), minutes: 60, topic: "Reading: short stories", teacher: "Christina", note: "Ottima partecipazione." },
      { id: "les_demo_3", studentId: "stu_demo_giulia", date: isoDate(-7), minutes: 90, topic: "Writing an opinion essay", teacher: "Christina", note: "" },
      { id: "les_demo_4", studentId: "stu_demo_leo", date: isoDate(-6), minutes: 45, topic: "Colours and animals song", teacher: "Christina", note: "" },
      { id: "les_demo_5", studentId: "stu_demo_marco", date: isoDate(-3), minutes: 60, topic: "Business emails", teacher: "Christina", note: "" },
    ],
    progress: [
      { id: "pro_demo_1", studentId: "stu_demo_giulia", date: isoDate(-60), level: "A2", skill: "Generale", comment: "Livello rilevato al test d'ingresso (demo)." },
      { id: "pro_demo_2", studentId: "stu_demo_giulia", date: isoDate(-10), level: "B1", skill: "Speaking", comment: "Più sicura nella conversazione (demo)." },
      { id: "pro_demo_3", studentId: "stu_demo_leo", date: isoDate(-6), level: "pre-A1", skill: "Listening", comment: "Riconosce colori e animali (demo)." },
    ],
    appointments: [
      { id: "app_demo_1", studentId: "stu_demo_giulia", startsAt: isoAt(2, 16), minutes: 60, title: "Lezione individuale", link: "", note: "" },
      { id: "app_demo_2", studentId: "stu_demo_leo", startsAt: isoAt(3, 17), minutes: 45, title: "Young learners", link: "", note: "" },
      { id: "app_demo_3", studentId: "stu_demo_marco", startsAt: isoAt(1, 19), minutes: 60, title: "Lezione individuale", link: "", note: "" },
    ],
    assignments: [
      { id: "asg_demo_1", studentId: "stu_demo_giulia", title: "Esercizi sul present perfect", description: "Completa gli esercizi 1–4 e scrivi 5 frasi su di te.", url: "", dueDate: isoDate(2), doneAt: null, createdAt: now },
      { id: "asg_demo_2", studentId: "stu_demo_leo", title: "Canzone dei colori", description: "Ascolta la canzone con un adulto e disegna il tuo colore preferito.", url: "", dueDate: isoDate(3), doneAt: null, createdAt: now },
    ],
    payments: [
      { id: "pay_demo_1", studentId: "stu_demo_giulia", label: "Rata 1 (demo)", dueDate: isoDate(-30), amount: "", status: "paid", statusUpdatedAt: now, statusUpdatedBy: "admin", note: "" },
      { id: "pay_demo_2", studentId: "stu_demo_giulia", label: "Rata 2 (demo)", dueDate: isoDate(4), amount: "", status: "pending", statusUpdatedAt: null, statusUpdatedBy: null, note: "" },
      { id: "pay_demo_3", studentId: "stu_demo_marco", label: "Rata 1 (demo)", dueDate: isoDate(6), amount: "", status: "pending", statusUpdatedAt: null, statusUpdatedBy: null, note: "" },
    ],
    reminders: [],
    certifications: [],
    shares: [],
    messages: [],
    files: [],
  };
}
