/**
 * Every student has their own login. Young learners usually have no email, so each account also has a
 * username (e.g. "giulia.r"), generated from the display name and unique across accounts.
 */
export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,39}$/;

export function baseUsername(displayName: string): string {
  const slug = displayName
    .replace(/\(.*?\)/g, " ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 30)
    .replace(/\.+$/, "");
  return slug.length >= 3 ? slug : `studente${slug ? `.${slug}` : ""}`;
}

/** First free username: "giulia.r", then "giulia.r2", "giulia.r3"… */
export function uniqueUsername(displayName: string, taken: Iterable<string>): string {
  const used = new Set([...taken].map((u) => u.toLowerCase()));
  const base = baseUsername(displayName);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}${n}`;
    if (!used.has(candidate)) return candidate;
  }
}

export function normalizeLogin(value: string): string {
  return value.trim().toLowerCase();
}

/** A login matches the account's email (when it has one) or its username. */
export function matchesLogin(account: { email: string; username?: string }, login: string): boolean {
  const l = normalizeLogin(login);
  if (!l) return false;
  return (account.email !== "" && account.email.toLowerCase() === l) || (account.username ?? "").toLowerCase() === l;
}

/** Only links to the student's class on Google Classroom are accepted. */
export function isClassroomUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "classroom.google.com";
  } catch {
    return false;
  }
}

export const CLASSROOM_HOME = "https://classroom.google.com/";
