import { describe, expect, it } from "vitest";
import { getByPath, readField, SECTIONS, setByPath, joinPath, listOf, countPlaceholders } from "@/lib/content/editor";
import { seedContent } from "@/lib/content/seed";
import { isPlaceholder, siteContentSchema } from "@/lib/content/schema";
import { isAmazonUrl, visibleBooks, visibleTestimonials, visibleTrips } from "@/lib/content/visibility";
import type { Appointment, Payment, Reminder } from "@/lib/domain";
import { en } from "@/lib/i18n/en";
import { it as itDict } from "@/lib/i18n/it";
import { t } from "@/lib/i18n";
import { planAutoReminders } from "@/lib/reminders";
import { isoToRomeLocal, romeLocalToIso } from "@/lib/time";
import { demoReply } from "@/lib/tutor/demo";
import { redactPersonalData } from "@/lib/tutor/privacy";
import { settingsPrompt, TUTOR_SYSTEM_PROMPT } from "@/lib/tutor/prompt";

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  return typeof value;
}

describe("i18n", () => {
  it("Italian and English dictionaries have the same keys and list lengths", () => {
    expect(shape(en)).toEqual(shape(itDict));
  });

  it("falls back to Italian when the English text is empty", () => {
    expect(t({ it: "Ciao", en: "" }, "en")).toBe("Ciao");
    expect(t({ it: "Ciao", en: "Hi" }, "en")).toBe("Hi");
  });
});

describe("content", () => {
  it("seed content is valid", () => {
    expect(() => siteContentSchema.parse(seedContent())).not.toThrow();
  });

  it("never publishes prices and never calls fees optional in the seed", () => {
    const text = JSON.stringify(seedContent());
    expect(text).not.toMatch(/€|\beuro\b|\bprezz/i);
  });

  it("does not invent contacts or legal data", () => {
    const c = seedContent();
    for (const v of [c.contact.email, c.contact.phone, c.legal.vat, c.legal.owner]) expect(isPlaceholder(v)).toBe(true);
    expect(c.testimonials).toEqual([]);
    expect(c.books).toEqual([]);
    expect(c.resources).toEqual([]);
  });

  it("shows only authentic, published testimonials", () => {
    const base = { id: "x", quote: { it: "Brava!", en: "" }, author: "Anna" };
    expect(visibleTestimonials([{ ...base, published: true, authentic: false }], "live")).toHaveLength(0);
    expect(visibleTestimonials([{ ...base, published: false, authentic: true }], "live")).toHaveLength(0);
    expect(visibleTestimonials([{ ...base, published: true, authentic: true }], "live")).toHaveLength(1);
  });

  it("hides trips with placeholders once the site is live", () => {
    const trips = seedContent().trips.items;
    expect(visibleTrips(trips, "preview")).toHaveLength(1);
    expect(visibleTrips(trips, "live")).toHaveLength(0);
  });

  it("accepts only Amazon links for books", () => {
    expect(isAmazonUrl("https://www.amazon.it/dp/123")).toBe(true);
    expect(isAmazonUrl("https://amzn.to/abc")).toBe(true);
    expect(isAmazonUrl("https://amazon.evil.com/dp/1")).toBe(false);
    expect(isAmazonUrl("https://example.com")).toBe(false);
    const book = { id: "b", published: true, title: "T", author: "", ageBand: "all" as const, level: "", note: { it: "", en: "" } };
    expect(visibleBooks([{ ...book, amazonUrl: "https://example.com/x" }])).toHaveLength(0);
  });
});

describe("content editor", () => {
  it("every editable path exists in the content", () => {
    const content = seedContent();
    for (const section of SECTIONS) {
      for (const f of section.fields) expect(getByPath(content, f.key), f.key).not.toBeUndefined();
      for (const list of section.lists) expect(Array.isArray(getByPath(content, list.path)), list.path).toBe(true);
    }
  });

  it("never creates new keys from form data", () => {
    const content = seedContent();
    expect(setByPath(content, "home.hacked", "x")).toBe(false);
    expect(setByPath(content, "courses.99.title", { it: "", en: "" })).toBe(false);
    expect(setByPath(content, "home.years", "30+")).toBe(true);
    expect(content.home.years).toBe("30+");
  });

  it("cleans URLs and booleans", () => {
    const get = (v: string | null) => () => v;
    expect(readField({ key: "u", label: "", kind: "url" }, "u", get("javascript:alert(1)"))).toBe("");
    expect(readField({ key: "u", label: "", kind: "url" }, "u", get("https://ok.it/x"))).toBe("https://ok.it/x");
    expect(readField({ key: "b", label: "", kind: "bool" }, "b", get(null))).toBe(false);
  });

  it("list paths join item fields correctly", () => {
    const content = seedContent();
    expect(getByPath(content, joinPath("placement.steps", 0, ""))).toEqual(listOf(content, "placement.steps")[0]);
    expect(countPlaceholders(content.contact)).toBeGreaterThan(0);
  });
});

describe("AI tutor", () => {
  it("removes emails and phone numbers", () => {
    const r = redactPersonalData("Sono Luca, scrivimi a luca@example.com o al 333 123 4567. Ho 3 compiti.");
    expect(r.redacted).toBe(true);
    expect(r.text).not.toContain("luca@example.com");
    expect(r.text).not.toContain("333 123 4567");
    expect(r.text).toContain("Ho 3 compiti");
    expect(redactPersonalData("Exercise 12, page 45").redacted).toBe(false);
  });

  it("system prompt carries the safety rules", () => {
    expect(TUTOR_SYSTEM_PROMPT).toMatch(/Never just hand over the finished homework/);
    expect(TUTOR_SYSTEM_PROMPT).toMatch(/not sure/);
    expect(TUTOR_SYSTEM_PROMPT).toMatch(/not an official assessment/);
    expect(TUTOR_SYSTEM_PROMPT).toMatch(/Do not ask for personal data/);
    expect(settingsPrompt({ ageBand: "young", level: "unknown", explainIn: "it" })).toMatch(/3–10/);
  });

  it("demo answers follow the graduated approach in the chosen language", () => {
    const s = { ageBand: "high" as const, level: "B1", explainIn: "it" as const };
    expect(demoReply("Aiutami con il present perfect.", s)).toMatch(/Indizio/);
    expect(demoReply("Help me with the present perfect.", { ...s, explainIn: "en" })).toMatch(/Hint/);
    expect(demoReply("Fammi esercitare con parole del mio livello.", { ...s, ageBand: "young" })).toMatch(/colori/);
    expect(demoReply("qualcosa di diverso", s).length).toBeGreaterThan(20);
  });
});

describe("reminders", () => {
  const settings = seedContent().reminders;
  const now = new Date("2026-11-01T10:00:00Z");
  const payment: Payment = {
    id: "p1",
    studentId: "s1",
    label: "Rata",
    dueDate: "2026-11-10",
    amount: "",
    status: "pending",
    statusUpdatedAt: null,
    statusUpdatedBy: null,
    note: "",
  };

  it("plans one reminder per pending payment, before the due date", () => {
    const plan = planAutoReminders(settings, [payment], [], [], now);
    expect(plan.create).toHaveLength(1);
    expect(plan.create[0]!.sendAt.slice(0, 10)).toBe("2026-11-05");
    expect(plan.create[0]!.kind).toBe("payment");
  });

  it("does not duplicate and cancels when the payment is settled", () => {
    const existing: Reminder = { id: "r1", ...planAutoReminders(settings, [payment], [], [], now).create[0]! };
    expect(planAutoReminders(settings, [payment], [], [existing], now).create).toHaveLength(0);
    const paid = { ...payment, status: "paid" as const };
    expect(planAutoReminders(settings, [paid], [], [existing], now).cancel).toEqual(["r1"]);
  });

  it("lesson reminders only when enabled", () => {
    const appt: Appointment = { id: "a1", studentId: "s1", startsAt: "2026-11-03T15:00:00.000Z", minutes: 60, title: "Lezione", link: "", note: "" };
    expect(planAutoReminders({ ...settings, autoLesson: false }, [], [appt], [], now).create).toHaveLength(0);
    expect(planAutoReminders({ ...settings, autoLesson: true }, [], [appt], [], now).create).toHaveLength(1);
  });
});

describe("time", () => {
  it("converts Italian local time in winter and summer", () => {
    expect(romeLocalToIso("2026-01-15T16:30")).toBe("2026-01-15T15:30:00.000Z");
    expect(romeLocalToIso("2026-07-15T16:30")).toBe("2026-07-15T14:30:00.000Z");
    expect(isoToRomeLocal("2026-07-15T14:30:00.000Z")).toBe("2026-07-15T16:30");
    expect(romeLocalToIso("nonsense")).toBeNull();
  });
});

