"use server";

import { z } from "zod";
import { isPlaceholder } from "@/lib/content/schema";
import { newId, type MessageTopic } from "@/lib/domain";
import { isLocale } from "@/lib/i18n";
import { sendEmail } from "@/server/email";
import { allow, clientKey } from "@/server/rate-limit";
import { getStore } from "@/server/store";
import { checkUpload } from "@/server/uploads";

export type RequestFormState = {
  status: "idle" | "ok" | "error";
  errors?: Partial<Record<"name" | "email" | "message" | "consent" | "file", true>>;
  rateLimited?: boolean;
  /** Echoed back so the form keeps what was typed after an error. */
  values?: Record<string, string | boolean>;
};

const TOPICS = ["courses", "payments", "placement", "trip", "other"] as const;

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40),
  ageBand: z.string().max(20),
  topic: z.enum(TOPICS),
  message: z.string().trim().min(10).max(5000),
  minor: z.boolean(),
  consent: z.literal(true),
  certificationTitle: z.string().trim().max(200),
  locale: z.string(),
});

/** Contact, placement-test and study-trip requests. A certificate file is optional and stored privately. */
export async function submitRequest(_prev: RequestFormState, formData: FormData): Promise<RequestFormState> {
  // Honeypot: bots fill every field; pretend it worked.
  if (String(formData.get("website") ?? "")) return { status: "ok" };

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    ageBand: String(formData.get("ageBand") ?? ""),
    topic: String(formData.get("topic") ?? "other"),
    message: String(formData.get("message") ?? ""),
    minor: formData.get("minor") === "on",
    consent: formData.get("consent") === "on",
    certificationTitle: String(formData.get("certificationTitle") ?? ""),
    locale: String(formData.get("locale") ?? "it"),
  };
  const parsed = schema.safeParse(raw);
  const upload = await checkUpload(formData.get("certification"));

  const errors: RequestFormState["errors"] = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "name" || key === "email" || key === "message" || key === "consent") errors[key] = true;
    }
  }
  if (upload === "invalid") errors.file = true;
  const { locale: _locale, ...values } = raw;
  if (!parsed.success || upload === "invalid") return { status: "error", errors, values };

  if (!allow(await clientKey("request"), 5, 30 * 60_000)) return { status: "error", rateLimited: true, values };

  const data = parsed.data;
  const store = getStore();
  const id = newId("msg");
  await store.insert("messages", {
    id,
    createdAt: new Date().toISOString(),
    topic: data.topic as MessageTopic,
    name: data.name,
    email: data.email,
    phone: data.phone,
    ageBand: data.ageBand,
    message: data.message,
    minor: data.minor,
    locale: isLocale(data.locale) ? data.locale : "it",
    certificationTitle: data.certificationTitle,
    read: false,
  });

  if (upload) {
    const fileId = newId("file");
    await store.savePrivateFile(fileId, upload.bytes, upload.contentType);
    await store.insert("files", { id: fileId, name: upload.name, contentType: upload.contentType, size: upload.bytes.length, studentId: null, createdAt: new Date().toISOString() });
    await store.insert("certifications", {
      id: newId("cert"),
      studentId: null,
      messageId: id,
      title: data.certificationTitle || upload.name,
      fileId,
      fileName: upload.name,
      status: "received",
      uploadedAt: new Date().toISOString(),
      uploadedBy: "public",
    });
  }

  const content = await store.getContent();
  const to = process.env.SCHOOL_NOTIFY_EMAIL || (isPlaceholder(content.contact.email) ? "" : content.contact.email);
  if (to) {
    await sendEmail({
      to,
      replyTo: data.email,
      subject: `Nuova richiesta dal sito (${data.topic})`,
      text: `Hai ricevuto una nuova richiesta da ${data.name}. Leggila nel pannello: /staff/messaggi\n(Per privacy i dettagli non sono riportati nell'email.)`,
    });
  }
  return { status: "ok" };
}
