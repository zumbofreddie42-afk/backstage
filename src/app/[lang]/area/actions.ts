"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { newId } from "@/lib/domain";
import { isLocale, type Locale } from "@/lib/i18n";
import { canSeeStudent } from "@/server/access";
import { endUserSession, getCurrentAccount, startUserSession } from "@/server/auth";
import { getSiteMode } from "@/server/config";
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "@/server/passwords";
import { allow, clientKey } from "@/server/rate-limit";
import { getStore } from "@/server/store";
import { checkUpload } from "@/server/uploads";

/** Redirect after a change, making sure the next page is rendered with fresh data (also for #anchors). */
function go(url: string): never {
  revalidatePath("/", "layout");
  redirect(url);
}

function localeOf(formData: FormData): Locale {
  const l = String(formData.get("locale") ?? "it");
  return isLocale(l) ? l : "it";
}

export async function login(formData: FormData) {
  const locale = localeOf(formData);
  if (!allow(await clientKey("area-login"), 10, 15 * 60_000)) go(`/${locale}/area/login?errore=troppi`);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const [account] = await getStore().list("accounts", (a) => a.email.toLowerCase() === email);
  const valid =
    account && account.active && !(account.demo && getSiteMode() === "live") && verifyPassword(password, account.passwordHash);
  if (!account || !valid) go(`/${locale}/area/login?errore=1`);
  await getStore().update("accounts", account.id, { lastLoginAt: new Date().toISOString() });
  await startUserSession(account.id);
  go(account.mustChangePassword ? `/${locale}/area/password` : `/${locale}/area`);
}

export async function logout(formData: FormData) {
  await endUserSession();
  go(`/${localeOf(formData)}/area/login`);
}

export async function changePassword(formData: FormData) {
  const locale = localeOf(formData);
  const account = await getCurrentAccount();
  if (!account) go(`/${locale}/area/login`);
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next.length < MIN_PASSWORD_LENGTH || next !== confirm) go(`/${locale}/area/password?errore=1`);
  await getStore().update("accounts", account.id, { passwordHash: hashPassword(next), mustChangePassword: false });
  go(`/${locale}/area`);
}

export async function toggleAssignment(formData: FormData) {
  const locale = localeOf(formData);
  const account = await getCurrentAccount();
  if (!account) go(`/${locale}/area/login`);
  const id = String(formData.get("id") ?? "");
  const assignment = await getStore().get("assignments", id);
  if (!assignment || !canSeeStudent(account, assignment.studentId)) go(`/${locale}/area`);
  await getStore().update("assignments", id, { doneAt: assignment.doneAt ? null : new Date().toISOString() });
  go(`/${locale}/area?s=${assignment.studentId}#compiti`);
}

export async function uploadCertification(formData: FormData) {
  const locale = localeOf(formData);
  const account = await getCurrentAccount();
  if (!account) go(`/${locale}/area/login`);
  const studentId = String(formData.get("studentId") ?? "");
  if (!canSeeStudent(account, studentId)) go(`/${locale}/area`);
  const back = `/${locale}/area?s=${studentId}`;
  if (!allow(`cert:${account.id}`, 10, 60 * 60_000)) go(`${back}&cert=errore#certificazioni`);
  const upload = await checkUpload(formData.get("file"));
  if (!upload || upload === "invalid") go(`${back}&cert=errore#certificazioni`);
  const store = getStore();
  const fileId = newId("file");
  await store.savePrivateFile(fileId, upload.bytes, upload.contentType);
  await store.insert("files", { id: fileId, name: upload.name, contentType: upload.contentType, size: upload.bytes.length, studentId, createdAt: new Date().toISOString() });
  await store.insert("certifications", {
    id: newId("cert"),
    studentId,
    messageId: null,
    title: String(formData.get("title") ?? "").trim().slice(0, 200) || upload.name,
    fileId,
    fileName: upload.name,
    status: "received",
    uploadedAt: new Date().toISOString(),
    uploadedBy: account.role === "guardian" ? "guardian" : "student",
  });
  go(`${back}&cert=ok#certificazioni`);
}
