"use server";

import { z } from "zod";
import { AGE_BANDS } from "@/lib/content/schema";
import { newId } from "@/lib/domain";
import { redactPersonalData } from "@/lib/tutor/privacy";
import { canSeeStudent } from "@/server/access";
import { getCurrentAccount } from "@/server/auth";
import { allow } from "@/server/rate-limit";
import { getStore } from "@/server/store";

const schema = z.object({
  studentId: z.string().min(1),
  note: z.string().max(1000),
  ageBand: z.enum(AGE_BANDS),
  level: z.string().max(20),
  transcript: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(10_000) }))
    .min(1)
    .max(60),
});

/** Saves a tutor conversation so the student's teacher can read it in the staff panel. */
export async function shareConversation(input: z.input<typeof schema>): Promise<{ ok: boolean }> {
  const account = await getCurrentAccount();
  const parsed = schema.safeParse(input);
  if (!account || !parsed.success || !canSeeStudent(account, parsed.data.studentId)) return { ok: false };
  if (!allow(`share:${account.id}`, 10, 60 * 60_000)) return { ok: false };
  const data = parsed.data;
  await getStore().insert("shares", {
    id: newId("shr"),
    studentId: data.studentId,
    createdAt: new Date().toISOString(),
    ageBand: data.ageBand,
    level: data.level,
    note: redactPersonalData(data.note).text,
    transcript: data.transcript.map((t) => (t.role === "user" ? { ...t, text: redactPersonalData(t.text).text } : t)),
    teacherReply: "",
    repliedAt: null,
  });
  return { ok: true };
}
