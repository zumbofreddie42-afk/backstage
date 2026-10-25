import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Account } from "@/lib/domain";
import type { Locale } from "@/lib/i18n";
import { getSiteMode } from "@/server/config";
import { getStore } from "@/server/store";

/**
 * Two separate sessions in signed, httpOnly cookies:
 * - students and guardians (accounts created by staff, scrypt passwords);
 * - the school's management area (ADMIN_PASSWORD): Christina is the only person working at the school.
 *   The "teacher" role is kept in the types but no longer has a password.
 * In local development without ADMIN_PASSWORD the staff password is "anteprima".
 */
export type StaffRole = "admin" | "teacher";
export type StaffSession = { kind: "staff"; role: StaffRole; exp: number };
export type UserSession = { kind: "user"; accountId: string; exp: number };

export const USER_COOKIE = "bs_user";
export const STAFF_COOKIE = "bs_staff";
const USER_HOURS = 24 * 7;
const STAFF_HOURS = 12;
const DEV_PASSWORD = "anteprima";

function adminPassword(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.NODE_ENV === "production" ? null : DEV_PASSWORD;
}

export function isDevPassword(): boolean {
  return !process.env.ADMIN_PASSWORD && process.env.NODE_ENV !== "production";
}

function secret(): string | null {
  const s = process.env.SESSION_SECRET ?? adminPassword();
  return s ? `backstage:${s}` : null;
}

function sign(payload: string): string {
  const s = secret();
  if (!s) throw new Error("SESSION_SECRET / ADMIN_PASSWORD non impostate");
  return createHmac("sha256", s).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function encodeToken(session: StaffSession | UserSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeToken(token: string | undefined, now = Date.now()): StaffSession | UserSession | null {
  if (!token || !secret()) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as StaffSession | UserSession;
    if (typeof s.exp !== "number" || s.exp < now) return null;
    if (s.kind === "staff" && (s.role === "admin" || s.role === "teacher")) return s;
    if (s.kind === "user" && typeof s.accountId === "string") return s;
    return null;
  } catch {
    return null;
  }
}

const cookieOptions = (hours: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: hours * 3600,
});

// ---- Staff ----

export function staffRoleForPassword(password: string): StaffRole | null {
  const admin = adminPassword();
  if (admin && safeEqual(password, admin)) return "admin";
  return null;
}

export function staffLoginAvailable(): boolean {
  return adminPassword() !== null;
}

export async function startStaffSession(role: StaffRole) {
  const token = encodeToken({ kind: "staff", role, exp: Date.now() + STAFF_HOURS * 3600_000 });
  (await cookies()).set(STAFF_COOKIE, token, cookieOptions(STAFF_HOURS));
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const s = decodeToken((await cookies()).get(STAFF_COOKIE)?.value);
  return s?.kind === "staff" ? s : null;
}

export async function endStaffSession() {
  (await cookies()).delete(STAFF_COOKIE);
}

/** For staff pages and actions: redirects when not allowed. */
export async function requireStaff(role: StaffRole = "teacher"): Promise<StaffSession> {
  const s = await getStaffSession();
  if (!s) redirect("/staff/login");
  if (role === "admin" && s.role !== "admin") redirect("/staff?negato=1");
  return s;
}

// ---- Students and guardians ----

export async function startUserSession(accountId: string) {
  const token = encodeToken({ kind: "user", accountId, exp: Date.now() + USER_HOURS * 3600_000 });
  (await cookies()).set(USER_COOKIE, token, cookieOptions(USER_HOURS));
}

export async function endUserSession() {
  (await cookies()).delete(USER_COOKIE);
}

/** The signed-in account, re-read from the store on every request (deactivation takes effect immediately). */
export async function getCurrentAccount(): Promise<Account | null> {
  const s = decodeToken((await cookies()).get(USER_COOKIE)?.value);
  if (s?.kind !== "user") return null;
  const account = await getStore().get("accounts", s.accountId);
  if (!account || !account.active) return null;
  if (account.demo && getSiteMode() === "live") return null;
  return account;
}

export async function requireAccount(locale: Locale): Promise<Account> {
  const account = await getCurrentAccount();
  if (!account) redirect(`/${locale}/area/login`);
  return account;
}
