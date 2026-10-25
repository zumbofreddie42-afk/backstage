"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSection, joinPath, listOf, readField, setByPath } from "@/lib/content/editor";
import { isAgeBand, type SiteContent } from "@/lib/content/schema";
import { isAmazonUrl } from "@/lib/content/visibility";
import { newId, type PaymentStatus, type ReminderKind } from "@/lib/domain";
import { isIsoDate, romeLocalToIso } from "@/lib/time";
import { isClassroomUrl, matchesLogin, uniqueUsername, USERNAME_RE } from "@/lib/usernames";
import { endStaffSession, requireStaff } from "@/server/auth";
import { hashPassword, temporaryPassword } from "@/server/passwords";
import { runReminders } from "@/server/reminders";
import { getStore } from "@/server/store";
import { checkUpload } from "@/server/uploads";

/** Redirect after a change, making sure the next page is rendered with fresh data (also for #anchors). */
function go(url: string): never {
  revalidatePath("/", "layout");
  redirect(url);
}

/** One-time message for the next page (temporary passwords are shown once, then expire). */
const FLASH_COOKIE = "bs_flash";

async function flash(message: string) {
  (await cookies()).set(FLASH_COOKIE, message, { httpOnly: true, sameSite: "strict", path: "/staff", maxAge: 120, secure: process.env.NODE_ENV === "production" });
}

function str(fd: FormData, name: string, max = 2000): string {
  return String(fd.get(name) ?? "").trim().slice(0, max);
}

function refreshSite() {
  revalidatePath("/", "layout");
}

export async function clearFlash() {
  (await cookies()).delete({ name: FLASH_COOKIE, path: "/staff" });
}

export async function logoutStaff() {
  await endStaffSession();
  go("/staff/login");
}

// ---------- Students ----------

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Classroom fields of the student form: only classroom.google.com links are kept. */
function classroomFields(fd: FormData) {
  const url = str(fd, "classroomUrl", 500);
  return { classroomUrl: isClassroomUrl(url) ? url : "", classroomCode: str(fd, "classroomCode", 40) };
}

/** Problem with a login name, or null when it can be used by `exceptId` (or by a new account). */
async function loginProblem(username: string, email: string, exceptId?: string): Promise<string | null> {
  if (!USERNAME_RE.test(username)) return "username";
  if (email && !EMAIL_RE.test(email)) return "email";
  const others = await getStore().list("accounts", (a) => a.id !== exceptId);
  if (others.some((a) => matchesLogin(a, username) || (email && matchesLogin(a, email)))) return "usata";
  return null;
}

async function newAccount(fields: { role: "student" | "guardian"; name: string; username: string; email: string; studentId: string | null; guardianOf: string[]; locale: string }) {
  const password = temporaryPassword();
  await getStore().insert("accounts", {
    id: newId("acc"),
    ...fields,
    locale: fields.locale === "en" ? "en" : "it",
    passwordHash: hashPassword(password),
    mustChangePassword: true,
    active: true,
    demo: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  });
  return password;
}

function credentialsMessage(who: string, username: string, email: string, password: string) {
  return `Credenziali di ${who} — nome utente: ${username}${email ? ` (oppure ${email})` : ""} · password temporanea: ${password}. Comunicale di persona: al primo accesso la password va cambiata. Questo messaggio non verrà più mostrato.`;
}

async function freeUsername(displayName: string) {
  const accounts = await getStore().list("accounts");
  return uniqueUsername(displayName, accounts.map((a) => a.username ?? ""));
}

/** Every new student gets their own credentials right away (email optional). */
export async function createStudent(fd: FormData) {
  await requireStaff();
  const displayName = str(fd, "displayName", 80);
  const ageBand = str(fd, "ageBand");
  const email = str(fd, "email", 200).toLowerCase();
  if (!displayName || !isAgeBand(ageBand)) go("/staff/studenti?errore=1");
  const username = await freeUsername(displayName);
  const problem = await loginProblem(username, email);
  if (problem) go(`/staff/studenti?errore=${problem}`);
  const id = newId("stu");
  await getStore().insert("students", {
    id,
    displayName,
    ageBand,
    level: str(fd, "level", 20),
    minor: fd.get("minor") === "on" || ageBand !== "adults",
    active: true,
    ...classroomFields(fd),
    staffNotes: str(fd, "staffNotes", 2000),
    demo: false,
    createdAt: new Date().toISOString(),
  });
  const password = await newAccount({ role: "student", name: displayName, username, email, studentId: id, guardianOf: [], locale: str(fd, "locale") });
  await flash(credentialsMessage(displayName, username, email, password));
  go(`/staff/studenti/${id}`);
}

export async function updateStudent(fd: FormData) {
  await requireStaff();
  const id = str(fd, "id");
  const ageBand = str(fd, "ageBand");
  if (!isAgeBand(ageBand)) go(`/staff/studenti/${id}?errore=1`);
  const url = str(fd, "classroomUrl", 500);
  if (url && !isClassroomUrl(url)) go(`/staff/studenti/${id}?errore=classroom#profilo`);
  await getStore().update("students", id, {
    displayName: str(fd, "displayName", 80) || "Studente",
    ageBand,
    level: str(fd, "level", 20),
    minor: fd.get("minor") === "on",
    active: fd.get("active") === "on",
    ...classroomFields(fd),
    staffNotes: str(fd, "staffNotes", 2000),
  });
  await flash("Profilo aggiornato.");
  go(`/staff/studenti/${id}`);
}

/** For students created before credentials became automatic. */
export async function createStudentAccount(fd: FormData) {
  await requireStaff();
  const studentId = str(fd, "studentId");
  const email = str(fd, "email", 200).toLowerCase();
  const back = `/staff/studenti/${studentId}`;
  const student = await getStore().get("students", studentId);
  if (!student) go("/staff/studenti");
  const username = str(fd, "username", 40).toLowerCase() || (await freeUsername(student.displayName));
  const problem = await loginProblem(username, email);
  if (problem) go(`${back}?errore=${problem}#accessi`);
  const password = await newAccount({ role: "student", name: student.displayName, username, email, studentId, guardianOf: [], locale: str(fd, "locale") });
  await flash(credentialsMessage(student.displayName, username, email, password));
  go(back);
}

export async function linkGuardian(fd: FormData) {
  await requireStaff();
  const studentId = str(fd, "studentId");
  const email = str(fd, "email", 200).toLowerCase();
  const back = `/staff/studenti/${studentId}`;
  if (!EMAIL_RE.test(email)) go(`${back}?errore=email#accessi`);
  const store = getStore();
  const [existing] = await store.list("accounts", (a) => matchesLogin(a, email));
  if (existing) {
    if (existing.role !== "guardian") go(`${back}?errore=usata#accessi`);
    await store.update("accounts", existing.id, { guardianOf: [...new Set([...existing.guardianOf, studentId])] });
    await flash(`${email} ora vede anche questo studente.`);
    go(back);
  }
  const name = str(fd, "name", 80) || "Genitore";
  const username = await freeUsername(name);
  const password = await newAccount({ role: "guardian", name, username, email, studentId: null, guardianOf: [studentId], locale: str(fd, "locale") });
  await flash(credentialsMessage(name, username, email, password));
  go(back);
}

/** Changes username and/or email of an account. */
export async function updateLogin(fd: FormData) {
  await requireStaff();
  const accountId = str(fd, "accountId");
  const back = str(fd, "back") || "/staff/studenti";
  const username = str(fd, "username", 40).toLowerCase();
  const email = str(fd, "email", 200).toLowerCase();
  const account = await getStore().get("accounts", accountId);
  if (!account) go(back);
  if (account.role === "guardian" && !email) go(`${back}?errore=email#accessi`);
  const problem = await loginProblem(username, email, accountId);
  if (problem) go(`${back}?errore=${problem}#accessi`);
  await getStore().update("accounts", accountId, { username, email });
  await flash("Credenziali aggiornate.");
  go(back);
}

export async function unlinkGuardian(fd: FormData) {
  await requireStaff();
  const accountId = str(fd, "accountId");
  const studentId = str(fd, "studentId");
  const account = await getStore().get("accounts", accountId);
  if (account) await getStore().update("accounts", accountId, { guardianOf: account.guardianOf.filter((id) => id !== studentId) });
  go(`/staff/studenti/${studentId}`);
}

export async function resetPassword(fd: FormData) {
  await requireStaff();
  const accountId = str(fd, "accountId");
  const back = str(fd, "back") || "/staff/studenti";
  const account = await getStore().get("accounts", accountId);
  if (!account) go(back);
  const password = temporaryPassword();
  await getStore().update("accounts", accountId, { passwordHash: hashPassword(password), mustChangePassword: true });
  await flash(`Nuova password temporanea per ${account.username || account.email}: ${password} — al primo accesso andrà cambiata.`);
  go(back);
}

export async function toggleAccount(fd: FormData) {
  await requireStaff();
  const accountId = str(fd, "accountId");
  const back = str(fd, "back") || "/staff/studenti";
  const account = await getStore().get("accounts", accountId);
  if (account) await getStore().update("accounts", accountId, { active: !account.active });
  go(back);
}

// ---------- Lessons, progress, appointments, homework ----------

export async function addLesson(fd: FormData) {
  await requireStaff();
  const studentId = str(fd, "studentId");
  const date = str(fd, "date");
  const minutes = Math.round(Number(fd.get("minutes")));
  if (!isIsoDate(date) || !(minutes > 0 && minutes <= 600)) go(`/staff/studenti/${studentId}?errore=lezione#lezioni`);
  await getStore().insert("lessons", { id: newId("les"), studentId, date, minutes, topic: str(fd, "topic", 200), teacher: "Christina", note: str(fd, "note", 500) });
  go(`/staff/studenti/${studentId}#lezioni`);
}

export async function addProgress(fd: FormData) {
  await requireStaff();
  const studentId = str(fd, "studentId");
  const date = str(fd, "date");
  const level = str(fd, "level", 20);
  if (!isIsoDate(date)) go(`/staff/studenti/${studentId}?errore=data#progressi`);
  await getStore().insert("progress", { id: newId("pro"), studentId, date, level, skill: str(fd, "skill", 80), comment: str(fd, "comment", 1000) });
  if (fd.get("updateLevel") === "on" && level) await getStore().update("students", studentId, { level });
  go(`/staff/studenti/${studentId}#progressi`);
}

export async function addAppointment(fd: FormData) {
  await requireStaff();
  const studentId = str(fd, "studentId");
  const startsAt = romeLocalToIso(str(fd, "startsAt"));
  const minutes = Math.round(Number(fd.get("minutes")));
  const link = str(fd, "link", 500);
  if (!startsAt || !(minutes > 0 && minutes <= 600)) go(`/staff/studenti/${studentId}?errore=appuntamento#appuntamenti`);
  await getStore().insert("appointments", {
    id: newId("app"),
    studentId,
    startsAt,
    minutes,
    title: str(fd, "title", 120) || "Lezione",
    link: /^https:\/\//.test(link) ? link : "",
    note: str(fd, "note", 500),
  });
  go(`/staff/studenti/${studentId}#appuntamenti`);
}

export async function addAssignment(fd: FormData) {
  await requireStaff();
  const studentId = str(fd, "studentId");
  const title = str(fd, "title", 200);
  const dueDate = str(fd, "dueDate");
  const url = str(fd, "url", 500);
  if (!title) go(`/staff/studenti/${studentId}?errore=compito#compiti`);
  await getStore().insert("assignments", {
    id: newId("asg"),
    studentId,
    title,
    description: str(fd, "description", 3000),
    url: /^https?:\/\//.test(url) ? url : "",
    dueDate: isIsoDate(dueDate) ? dueDate : "",
    doneAt: null,
    createdAt: new Date().toISOString(),
  });
  go(`/staff/studenti/${studentId}#compiti`);
}

const DELETABLE = ["lessons", "progress", "appointments", "assignments", "reminders"] as const;

export async function deleteRecord(fd: FormData) {
  await requireStaff();
  const kind = str(fd, "kind");
  const id = str(fd, "id");
  const back = str(fd, "back") || "/staff";
  const collection = DELETABLE.find((k) => k === kind);
  if (collection) await getStore().remove(collection, id);
  go(back);
}

// ---------- Payments (admin only) ----------

export async function addPayment(fd: FormData) {
  await requireStaff("admin");
  const studentId = str(fd, "studentId");
  const dueDate = str(fd, "dueDate");
  const label = str(fd, "label", 120);
  if (!label || !isIsoDate(dueDate)) go(`/staff/studenti/${studentId}?errore=pagamento#pagamenti`);
  await getStore().insert("payments", {
    id: newId("pay"),
    studentId,
    label,
    dueDate,
    amount: str(fd, "amount", 40),
    status: "pending",
    statusUpdatedAt: null,
    statusUpdatedBy: null,
    note: str(fd, "note", 500),
  });
  await runReminders();
  go(`/staff/studenti/${studentId}#pagamenti`);
}

export async function setPaymentStatus(fd: FormData) {
  const session = await requireStaff("admin");
  const id = str(fd, "id");
  const status = str(fd, "status") as PaymentStatus;
  const payment = await getStore().get("payments", id);
  if (!payment || !["pending", "paid", "cancelled"].includes(status)) go("/staff/studenti");
  // Recorded by an authorised person: the site never marks a payment as paid on its own.
  await getStore().update("payments", id, { status, statusUpdatedAt: new Date().toISOString(), statusUpdatedBy: session.role });
  await runReminders();
  go(`/staff/studenti/${payment.studentId}#pagamenti`);
}

export async function deletePayment(fd: FormData) {
  await requireStaff("admin");
  const id = str(fd, "id");
  const payment = await getStore().get("payments", id);
  if (payment) await getStore().remove("payments", id);
  await runReminders();
  go(payment ? `/staff/studenti/${payment.studentId}#pagamenti` : "/staff/studenti");
}

// ---------- Reminders ----------

export async function addReminder(fd: FormData) {
  const session = await requireStaff();
  const studentId = str(fd, "studentId");
  const kind = (["payment", "lesson", "other"].includes(str(fd, "kind")) ? str(fd, "kind") : "other") as ReminderKind;
  if (kind === "payment" && session.role !== "admin") go(`/staff/studenti/${studentId}?errore=permessi#promemoria`);
  const sendAt = str(fd, "sendAt") ? romeLocalToIso(str(fd, "sendAt")) : new Date().toISOString();
  const message = str(fd, "message", 500);
  if (!message || !sendAt) go(`/staff/studenti/${studentId}?errore=promemoria#promemoria`);
  await getStore().insert("reminders", {
    id: newId("rem"),
    studentId,
    kind,
    message,
    sendAt,
    toStudent: fd.get("toStudent") === "on",
    toGuardians: fd.get("toGuardians") === "on",
    byEmail: fd.get("byEmail") === "on",
    status: "scheduled",
    sentAt: null,
    sourceId: null,
    deliveryLog: "",
  });
  await runReminders();
  go(`/staff/studenti/${studentId}#promemoria`);
}

export async function cancelReminder(fd: FormData) {
  await requireStaff();
  const id = str(fd, "id");
  const back = str(fd, "back") || "/staff/promemoria";
  await getStore().update("reminders", id, { status: "cancelled" });
  go(back);
}

export async function runRemindersNow() {
  await requireStaff();
  const res = await runReminders();
  await flash(`Promemoria aggiornati: ${res.created} creati, ${res.sent} inviati.`);
  go("/staff/promemoria");
}

export async function saveReminderSettings(fd: FormData) {
  await requireStaff("admin");
  await getStore().updateContent((c) => {
    c.reminders = {
      paymentDaysBefore: Math.min(60, Math.max(0, Math.round(Number(fd.get("paymentDaysBefore")) || 0))),
      lessonHoursBefore: Math.min(168, Math.max(0, Math.round(Number(fd.get("lessonHoursBefore")) || 0))),
      autoPayment: fd.get("autoPayment") === "on",
      autoLesson: fd.get("autoLesson") === "on",
      emailChannel: fd.get("emailChannel") === "on",
      notifyGuardians: fd.get("notifyGuardians") === "on",
      notifyStudents: fd.get("notifyStudents") === "on",
    };
  });
  await flash("Impostazioni dei promemoria salvate. Valgono per i nuovi promemoria automatici.");
  go("/staff/promemoria");
}

// ---------- Certifications, tutor shares, requests ----------

export async function setCertificationStatus(fd: FormData) {
  await requireStaff();
  const id = str(fd, "id");
  const back = str(fd, "back") || "/staff";
  const cert = await getStore().get("certifications", id);
  if (cert) await getStore().update("certifications", id, { status: cert.status === "checked" ? "received" : "checked" });
  go(back);
}

export async function deleteCertification(fd: FormData) {
  await requireStaff();
  const id = str(fd, "id");
  const back = str(fd, "back") || "/staff";
  const store = getStore();
  const cert = await store.get("certifications", id);
  if (cert) {
    await store.deletePrivateFile(cert.fileId);
    await store.remove("files", cert.fileId);
    await store.remove("certifications", id);
  }
  go(back);
}

export async function replyShare(fd: FormData) {
  await requireStaff();
  const id = str(fd, "id");
  const share = await getStore().get("shares", id);
  if (!share) go("/staff");
  await getStore().update("shares", id, { teacherReply: str(fd, "reply", 3000), repliedAt: new Date().toISOString() });
  go(`/staff/studenti/${share.studentId}#conversazioni`);
}

export async function toggleMessageRead(fd: FormData) {
  await requireStaff();
  const id = str(fd, "id");
  const m = await getStore().get("messages", id);
  if (m) await getStore().update("messages", id, { read: !m.read });
  go("/staff/richieste");
}

export async function deleteMessage(fd: FormData) {
  await requireStaff("admin");
  const id = str(fd, "id");
  const store = getStore();
  for (const cert of await store.list("certifications", (c) => c.messageId === id)) {
    await store.deletePrivateFile(cert.fileId);
    await store.remove("files", cert.fileId);
    await store.remove("certifications", cert.id);
  }
  await store.remove("messages", id);
  go("/staff/richieste");
}

// ---------- Site content (admin only) ----------

export async function saveSection(fd: FormData) {
  await requireStaff("admin");
  const section = getSection(str(fd, "section"));
  if (!section) go("/staff/contenuti");
  const back = `/staff/contenuti/${section.key}`;
  const get = (key: string) => {
    const v = fd.get(key);
    return typeof v === "string" ? v : null;
  };
  let badAmazon = false;
  try {
    await getStore().updateContent((c: SiteContent) => {
      for (const field of section.fields) setByPath(c, field.key, readField(field, field.key, get));
      for (const list of section.lists) {
        listOf(c, list.path).forEach((_item, i) => {
          for (const field of list.fields) {
            const path = joinPath(list.path, i, field.key);
            const value = readField(field, path, get);
            if (list.path === "books" && field.key === "amazonUrl" && value && !isAmazonUrl(String(value))) {
              badAmazon = true;
              continue;
            }
            setByPath(c, path, value);
          }
        });
      }
    });
  } catch (err) {
    console.error("[contenuti] salvataggio non valido", err);
    go(`${back}?errore=1`);
  }
  refreshSite();
  await flash(badAmazon ? "Salvato, ma un link non è di Amazon ed è stato ignorato." : "Modifiche salvate e pubblicate.");
  go(back);
}

export async function addListItem(fd: FormData) {
  await requireStaff("admin");
  const section = getSection(str(fd, "section"));
  const list = section?.lists.find((l) => l.path === str(fd, "addList"));
  if (!section || !list || list.fixed || !list.newItem) go("/staff/contenuti");
  await getStore().updateContent((c) => {
    listOf(c, list.path).push(list.newItem!());
  });
  go(`/staff/contenuti/${section.key}#fine`);
}

export async function moveListItem(fd: FormData) {
  await requireStaff("admin");
  // The clicked button sends "move" = "<list path>|<index>|<up|down|delete>".
  const [listPath = "", rawIndex = "", action = ""] = str(fd, "move").split("|");
  const section = getSection(str(fd, "section"));
  const list = section?.lists.find((l) => l.path === listPath);
  if (!section || !list) go("/staff/contenuti");
  const index = Number(rawIndex);
  let photoUrl: string | null = null;
  await getStore().updateContent((c) => {
    const items = listOf(c, list.path);
    if (!Number.isInteger(index) || index < 0 || index >= items.length) return;
    if (action === "delete" && !list.fixed) {
      const [removed] = items.splice(index, 1);
      if (list.path === "about.photos") photoUrl = (removed as { url?: string }).url ?? null;
      return;
    }
    const target = action === "up" ? index - 1 : action === "down" ? index + 1 : -1;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
  });
  if (photoUrl) await getStore().deletePublicFile(photoUrl);
  refreshSite();
  go(`/staff/contenuti/${section.key}`);
}

export async function uploadPhoto(fd: FormData) {
  await requireStaff("admin");
  const target = str(fd, "target");
  const upload = await checkUpload(fd.get("photo"), { images: true, pdf: false });
  if (!upload || upload === "invalid") go("/staff/contenuti/about?errore=foto");
  const store = getStore();
  const url = await store.savePublicFile(`${newId("img")}.${upload.ext}`, upload.bytes, upload.contentType);
  let previous = "";
  await store.updateContent((c) => {
    if (target === "portrait") {
      previous = c.about.portrait.url;
      c.about.portrait.url = url;
    } else {
      c.about.photos.push({ id: newId("photo"), url, alt: { it: str(fd, "alt.it", 300), en: str(fd, "alt.en", 300) }, caption: { it: "", en: "" } });
    }
  });
  if (previous) await store.deletePublicFile(previous);
  refreshSite();
  await flash("Foto caricata.");
  go("/staff/contenuti/about");
}

export async function removePortrait() {
  await requireStaff("admin");
  let previous = "";
  await getStore().updateContent((c) => {
    previous = c.about.portrait.url;
    c.about.portrait.url = "";
  });
  if (previous) await getStore().deletePublicFile(previous);
  refreshSite();
  go("/staff/contenuti/about");
}
