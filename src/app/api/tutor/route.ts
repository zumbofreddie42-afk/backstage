import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AGE_BANDS } from "@/lib/content/schema";
import { demoReply } from "@/lib/tutor/demo";
import { MAX_MESSAGE_CHARS, MAX_TURNS, redactPersonalData } from "@/lib/tutor/privacy";
import { settingsPrompt, TUTOR_SYSTEM_PROMPT } from "@/lib/tutor/prompt";
import { getCurrentAccount } from "@/server/auth";
import { isTutorLive, tutorAccess, tutorModel } from "@/server/config";
import { allow, clientKey } from "@/server/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  settings: z.object({
    ageBand: z.enum(AGE_BANDS),
    level: z.string().max(20),
    explainIn: z.enum(["it", "en", "mixed"]),
  }),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().min(1).max(MAX_MESSAGE_CHARS * 2) }))
    .min(1)
    .max(MAX_TURNS * 2),
});

/**
 * Chat endpoint of the AI English Tutor. Conversations are not stored: the browser sends the
 * history each time. Emails and phone numbers are removed before anything reaches the model.
 * Live AI only with ANTHROPIC_API_KEY, and (by default) only for signed-in students/guardians;
 * otherwise scripted demo answers, flagged with the X-Tutor-Mode header.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const { settings } = parsed.data;
  const last = parsed.data.messages.at(-1)!;
  if (last.role !== "user") return Response.json({ error: "invalid" }, { status: 400 });
  if (last.text.length > MAX_MESSAGE_CHARS) return Response.json({ error: "too_long" }, { status: 413 });

  const account = await getCurrentAccount();
  const live = isTutorLive() && (tutorAccess() === "public" || account !== null);
  const key = account ? `tutor:acc:${account.id}` : await clientKey("tutor");
  const limit = account ? 60 : live ? 15 : 40;
  if (!allow(key, limit, 60 * 60_000)) return Response.json({ error: "rate_limited" }, { status: 429 });

  let anyRedacted = false;
  const history = parsed.data.messages.slice(-MAX_TURNS * 2).map((m) => {
    if (m.role !== "user") return m;
    const r = redactPersonalData(m.text);
    anyRedacted ||= r.redacted;
    return { ...m, text: r.text };
  });
  // The API requires the conversation to start with a user turn.
  while (history[0]?.role === "assistant") history.shift();

  const headers = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Tutor-Mode": live ? "live" : "demo",
    "X-Tutor-Redacted": anyRedacted ? "1" : "0",
  };

  if (!live) return new Response(demoReply(history.at(-1)!.text, settings), { headers });

  const client = new Anthropic();
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({ role: m.role, content: m.text }));
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = client.beta.messages.stream(
          {
            model: tutorModel(),
            max_tokens: 4000,
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            output_config: { effort: "low" },
            system: [
              { type: "text", text: TUTOR_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
              { type: "text", text: settingsPrompt(settings) },
            ],
            messages,
          },
          { signal: req.signal },
        );
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") controller.enqueue(encoder.encode("\n\u0000refused"));
      } catch (err) {
        if (!req.signal.aborted) {
          console.error("[tutor] errore", err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err);
          controller.enqueue(encoder.encode("\n\u0000error"));
        }
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, { headers });
}
