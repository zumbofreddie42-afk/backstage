import type { AgeBand } from "@/lib/content/schema";
import type { Locale } from "@/lib/i18n";

/**
 * Private data of the student area. Every record that belongs to a student carries `studentId`;
 * access rules live in src/server/access.ts.
 */

export type AccountRole = "student" | "guardian";

/** Login for a student (usually 11+) or a parent/guardian. Created only by school staff. */
export type Account = {
  id: string;
  role: AccountRole;
  name: string;
  /** Unique login name (every student has one, even without an email). */
  username: string;
  /** Optional: young learners often have none. Used for login and email reminders when present. */
  email: string;
  passwordHash: string;
  mustChangePassword: boolean;
  active: boolean;
  /** Student accounts: the student profile they belong to. */
  studentId: string | null;
  /** Guardian accounts: the students they can see. */
  guardianOf: string[];
  locale: Locale;
  demo: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export type Student = {
  id: string;
  /** First name + initial is enough: avoid storing more than needed. */
  displayName: string;
  ageBand: AgeBand;
  level: string;
  minor: boolean;
  active: boolean;
  /** Link to the student's class on Google Classroom, where all course materials are. */
  classroomUrl?: string;
  /** Class code to join the course on Google Classroom the first time. */
  classroomCode?: string;
  /** Visible only to Christina. */
  staffNotes: string;
  demo: boolean;
  createdAt: string;
};

export type Lesson = {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  topic: string;
  teacher: string;
  note: string;
};

export type ProgressEntry = {
  id: string;
  studentId: string;
  date: string;
  level: string;
  skill: string;
  comment: string;
};

export type Appointment = {
  id: string;
  studentId: string;
  startsAt: string; // ISO, Europe/Rome wall time converted when created
  minutes: number;
  title: string;
  link: string;
  note: string;
};

export type Assignment = {
  id: string;
  studentId: string;
  title: string;
  description: string;
  url: string;
  dueDate: string; // YYYY-MM-DD or ""
  doneAt: string | null;
  createdAt: string;
};

export type PaymentStatus = "pending" | "paid" | "cancelled";

/** An instalment communicated by the school. Status changes only by an authorised staff member. */
export type Payment = {
  id: string;
  studentId: string;
  label: string;
  dueDate: string;
  /** Free text as communicated by the school (e.g. "120 €"); never shown on the public site. */
  amount: string;
  status: PaymentStatus;
  statusUpdatedAt: string | null;
  statusUpdatedBy: string | null;
  note: string;
};

export type ReminderKind = "payment" | "lesson" | "other";
export type ReminderStatus = "scheduled" | "sent" | "cancelled";

export type Reminder = {
  id: string;
  studentId: string;
  kind: ReminderKind;
  message: string;
  sendAt: string; // ISO
  toStudent: boolean;
  toGuardians: boolean;
  byEmail: boolean;
  status: ReminderStatus;
  sentAt: string | null;
  /** Set for reminders generated automatically from a payment/appointment, to avoid duplicates. */
  sourceId: string | null;
  deliveryLog: string;
};

export type Certification = {
  id: string;
  /** null when it came from the public placement-test form. */
  studentId: string | null;
  messageId: string | null;
  title: string;
  fileId: string;
  fileName: string;
  status: "received" | "checked";
  uploadedAt: string;
  uploadedBy: "student" | "guardian" | "public" | "staff";
};

export type TutorTurn = { role: "user" | "assistant"; text: string };

export type TutorShare = {
  id: string;
  studentId: string;
  createdAt: string;
  ageBand: AgeBand;
  level: string;
  note: string;
  transcript: TutorTurn[];
  teacherReply: string;
  repliedAt: string | null;
};

export type MessageTopic = "courses" | "payments" | "placement" | "trip" | "other";

export type ContactMessage = {
  id: string;
  createdAt: string;
  topic: MessageTopic;
  name: string;
  email: string;
  phone: string;
  ageBand: string;
  message: string;
  minor: boolean;
  locale: Locale;
  certificationTitle: string;
  read: boolean;
};

/** Metadata of a private uploaded file (bytes live in the store). */
export type StoredFileMeta = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  studentId: string | null;
  createdAt: string;
};

export type Collections = {
  accounts: Account;
  students: Student;
  lessons: Lesson;
  progress: ProgressEntry;
  appointments: Appointment;
  assignments: Assignment;
  payments: Payment;
  reminders: Reminder;
  certifications: Certification;
  shares: TutorShare;
  messages: ContactMessage;
  files: StoredFileMeta;
};

export type CollectionName = keyof Collections;
export const COLLECTIONS: CollectionName[] = [
  "accounts",
  "students",
  "lessons",
  "progress",
  "appointments",
  "assignments",
  "payments",
  "reminders",
  "certifications",
  "shares",
  "messages",
  "files",
];

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
