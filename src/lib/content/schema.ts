import { z } from "zod";

/** Placeholders look like {{EMAIL}}: the school replaces them from the staff panel. */
export const PLACEHOLDER_RE = /\{\{[^}]+\}\}/;

export function isPlaceholder(value: string | undefined | null): boolean {
  return !value || !value.trim() || PLACEHOLDER_RE.test(value);
}

export const AGE_BANDS = ["young", "middle", "high", "adults"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];
export const isAgeBand = (v: unknown): v is AgeBand => typeof v === "string" && (AGE_BANDS as readonly string[]).includes(v);

export const LEVELS = ["pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"] as const;

const text = z.string().max(20_000);
export const lSchema = z.object({ it: text, en: text });
const url = z.string().max(2000);

export const photoSchema = z.object({
  id: z.string(),
  url,
  alt: lSchema,
  caption: lSchema,
});

export const courseSchema = z.object({
  id: z.enum(AGE_BANDS),
  title: lSchema,
  ages: lSchema,
  summary: lSchema,
  activities: lSchema,
  goals: lSchema,
});

export const tripSchema = z.object({
  id: z.string(),
  published: z.boolean(),
  title: lSchema,
  destination: lSchema,
  dates: lSchema,
  activities: lSchema,
  participation: lSchema,
});

export const resourceSchema = z.object({
  id: z.string(),
  published: z.boolean(),
  title: lSchema,
  description: lSchema,
  url,
  ageBand: z.enum([...AGE_BANDS, "all"]),
  level: z.string().max(20),
  topic: lSchema,
});

export const bookSchema = z.object({
  id: z.string(),
  published: z.boolean(),
  title: z.string().max(300),
  author: z.string().max(300),
  /** Only links provided by Backstage. */
  amazonUrl: url,
  ageBand: z.enum([...AGE_BANDS, "all"]),
  level: z.string().max(20),
  note: lSchema,
});

export const testimonialSchema = z.object({
  id: z.string(),
  /** Shown only when published AND confirmed authentic by the school. */
  published: z.boolean(),
  authentic: z.boolean(),
  quote: lSchema,
  author: z.string().max(200),
});

export const siteContentSchema = z.object({
  home: z.object({
    heroTitle: lSchema,
    heroText: lSchema,
    intro: lSchema,
    years: z.string().max(20),
  }),
  about: z.object({
    story: lSchema,
    approach: lSchema,
    role: lSchema,
    method: lSchema,
    portrait: photoSchema,
    photos: z.array(photoSchema),
  }),
  courses: z.array(courseSchema),
  placement: z.object({
    steps: z.array(lSchema),
    note: lSchema,
  }),
  trips: z.object({
    intro: lSchema,
    trinityNote: lSchema,
    items: z.array(tripSchema),
  }),
  resources: z.array(resourceSchema),
  books: z.array(bookSchema),
  amazon: z.object({
    affiliate: z.boolean(),
    disclosure: lSchema,
  }),
  testimonials: z.array(testimonialSchema),
  contact: z.object({
    email: z.string().max(200),
    phone: z.string().max(60),
    whatsapp: z.string().max(60),
    address: lSchema,
    hours: lSchema,
    instagram: url,
    facebook: url,
    youtube: url,
    tiktok: url,
    linkedin: url,
  }),
  legal: z.object({
    owner: z.string().max(300),
    vat: z.string().max(60),
    registeredOffice: z.string().max(300),
    privacyEmail: z.string().max(200),
    privacyExtra: lSchema,
  }),
  reminders: z.object({
    paymentDaysBefore: z.number().int().min(0).max(60),
    lessonHoursBefore: z.number().int().min(0).max(168),
    autoPayment: z.boolean(),
    autoLesson: z.boolean(),
    emailChannel: z.boolean(),
    notifyGuardians: z.boolean(),
    notifyStudents: z.boolean(),
  }),
});

export type SiteContent = z.infer<typeof siteContentSchema>;
export type Course = z.infer<typeof courseSchema>;
export type Trip = z.infer<typeof tripSchema>;
export type Resource = z.infer<typeof resourceSchema>;
export type Book = z.infer<typeof bookSchema>;
export type Testimonial = z.infer<typeof testimonialSchema>;
export type Photo = z.infer<typeof photoSchema>;
