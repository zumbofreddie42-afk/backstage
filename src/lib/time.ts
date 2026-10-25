const TZ = "Europe/Rome";

/** Offset of Europe/Rome from UTC, in minutes, at the given instant (60 in winter, 120 in summer). */
function romeOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/** "2026-11-03T16:30" typed in Italy (datetime-local) → ISO instant. Returns null when invalid. */
export function romeLocalToIso(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const naive = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!);
  let guess = naive - romeOffsetMinutes(new Date(naive)) * 60_000;
  guess = naive - romeOffsetMinutes(new Date(guess)) * 60_000;
  return new Date(guess).toISOString();
}

/** ISO instant → "YYYY-MM-DDTHH:mm" in Italian time (for datetime-local inputs). */
export function isoToRomeLocal(iso: string): string {
  const d = new Date(iso);
  const local = new Date(d.getTime() + romeOffsetMinutes(d) * 60_000);
  return local.toISOString().slice(0, 16);
}

export function todayInRome(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Current time; a function so server components can read it without tripping the React purity lint. */
export const nowMs = () => Date.now();
