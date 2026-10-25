"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { shareConversation } from "@/app/[lang]/area/tutor-actions";
import { AGE_BANDS, LEVELS, type AgeBand } from "@/lib/content/schema";
import type { Dictionary } from "@/lib/i18n";
import type { ExplainLanguage } from "@/lib/tutor/prompt";
import { MAX_MESSAGE_CHARS, redactPersonalData } from "@/lib/tutor/privacy";
import { buttonClass } from "@/components/ui";
import { TutorMarkdown } from "@/components/tutor-markdown";

type Msg = { role: "user" | "assistant"; text: string; demo?: boolean; failed?: boolean };

export type TutorChatProps = {
  d: Dictionary;
  ageBands: Record<AgeBand, string>;
  /** What the server will do for this visitor (the API decides again on every request). */
  live: boolean;
  initialAgeBand?: AgeBand;
  initialLevel?: string;
  initialExplainIn: ExplainLanguage;
  initialQuestion?: string;
  /** Present when a signed-in student/guardian can share the conversation with the teacher. */
  shareStudentId?: string;
};

export function TutorChat(props: TutorChatProps) {
  const { d, ageBands, live, shareStudentId } = props;
  const tt = d.tutor;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState(props.initialQuestion ?? "");
  const [ageBand, setAgeBand] = useState<AgeBand>(props.initialAgeBand ?? "middle");
  const [level, setLevel] = useState(props.initialLevel ?? "unknown");
  const [explainIn, setExplainIn] = useState<ExplainLanguage>(props.initialExplainIn);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [shareState, setShareState] = useState<"idle" | "open" | "sending" | "done" | "error">("idle");
  const [shareNote, setShareNote] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    if (text.length > MAX_MESSAGE_CHARS) {
      setNotice(tt.tooLong);
      return;
    }
    const { text: clean, redacted } = redactPersonalData(text);
    setNotice(redacted ? tt.privacyWarning : null);
    const history: Msg[] = [...messages.filter((m) => !m.failed), { role: "user", text: clean }];
    setMessages([...history, { role: "assistant", text: "" }]);
    setInput("");
    setBusy(true);
    setShareState((s) => (s === "done" ? "idle" : s));
    const controller = new AbortController();
    abortRef.current = controller;

    const finish = (patch: Partial<Msg>) =>
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant") next[next.length - 1] = { ...last, ...patch };
        return next;
      });

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { ageBand, level, explainIn }, messages: history.map(({ role, text }) => ({ role, text })) }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const code = res.status === 429 ? tt.rateLimited : res.status === 413 ? tt.tooLong : tt.error;
        finish({ text: code, failed: true });
        return;
      }
      const demo = res.headers.get("X-Tutor-Mode") !== "live";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        finish({ text: acc.split("\u0000")[0]!, demo });
      }
      if (acc.includes("\u0000refused")) finish({ text: tt.refused, failed: true });
      else if (acc.includes("\u0000error")) finish({ text: acc.split("\u0000")[0]!.trim() || tt.error, failed: !acc.split("\u0000")[0]!.trim() });
      else if (!acc.trim()) finish({ text: tt.error, failed: true });
    } catch (err) {
      if ((err as Error).name !== "AbortError") finish({ text: tt.error, failed: true });
    } finally {
      setBusy(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }

  async function share() {
    if (!shareStudentId) return;
    setShareState("sending");
    const res = await shareConversation({
      studentId: shareStudentId,
      note: shareNote,
      ageBand,
      level,
      transcript: messages.filter((m) => !m.failed && m.text).map(({ role, text }) => ({ role, text })),
    }).catch(() => ({ ok: false }));
    setShareState(res.ok ? "done" : "error");
    if (res.ok) setShareNote("");
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const canHelp = !busy && lastAssistant && !lastAssistant.failed && lastAssistant.text;
  const hasConversation = messages.some((m) => m.role === "assistant" && !m.failed && m.text);

  return (
    <div className="overflow-hidden rounded-[2rem] border-2 border-border bg-white shadow-xl shadow-primary/10">
      {/* Header + settings */}
      <div className="bg-gradient-to-r from-ink to-primary p-4 text-white sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image src="/brand/backstage-logo.jpg" alt="" width={150} height={150} className="h-10 w-10 rounded-full ring-2 ring-white/70" />
            <div>
              <p className="font-display text-lg font-extrabold leading-tight">{tt.title}</p>
              <p className="text-xs text-ink-muted">{d.meta.siteName}</p>
            </div>
          </div>
          <span className={clsx("rounded-full px-3 py-1 text-xs font-bold", live ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn")}>
            {live ? tt.statusLive : tt.statusDemo}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold">
            {tt.ageBand}
            <select value={ageBand} onChange={(e) => setAgeBand(e.target.value as AgeBand)} className="field mt-1 py-2 text-sm">
              {AGE_BANDS.map((b) => (
                <option key={b} value={b}>
                  {ageBands[b]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            {tt.level}
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="field mt-1 py-2 text-sm">
              <option value="unknown">{tt.levelUnknown}</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            {tt.explainIn}
            <select value={explainIn} onChange={(e) => setExplainIn(e.target.value as ExplainLanguage)} className="field mt-1 py-2 text-sm">
              <option value="it">{tt.explainIt}</option>
              <option value="en">{tt.explainEn}</option>
              <option value="mixed">{tt.explainMixed}</option>
            </select>
          </label>
        </div>
      </div>

      {!live && <p className="border-b border-border bg-warn-soft px-5 py-2.5 text-sm text-warn">{tt.demoExplain}</p>}
      {ageBand === "young" && <p className="border-b border-border bg-magenta-soft px-5 py-2.5 font-kids text-[0.95rem] text-magenta-strong">👋 {tt.kidsNote}</p>}

      {/* Conversation */}
      <div ref={listRef} role="log" aria-label={tt.chatLabel} aria-live="polite" aria-busy={busy} className="h-[26rem] space-y-4 overflow-y-auto bg-muted/60 p-4 sm:p-5">
        {messages.length === 0 && (
          <div>
            <p className="text-center text-sm font-semibold text-muted-foreground">{tt.whatTitle}</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {tt.starters.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => send(s)}
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-left text-[0.95rem] font-medium text-ink hover:border-primary hover:bg-lavender"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={clsx(
                "max-w-[88%] rounded-3xl px-4 py-3 text-[0.97rem]",
                m.role === "user" ? "rounded-br-md bg-primary text-white" : m.failed ? "rounded-bl-md bg-danger-soft text-danger" : "rounded-bl-md border border-border bg-white text-ink",
              )}
            >
              <p className="sr-only">{m.role === "user" ? tt.you : tt.assistant}:</p>
              {m.role === "assistant" && m.demo && !m.failed && m.text && (
                <p className="mb-1.5 inline-block rounded-full bg-warn-soft px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-warn">{tt.demoTag}</p>
              )}
              {m.role === "assistant" && !m.text ? (
                <span className="text-primary" aria-label={tt.sending}>
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
              ) : m.role === "assistant" ? (
                <TutorMarkdown text={m.text} />
              ) : (
                <p className="whitespace-pre-wrap">{m.text}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Graduated help */}
      {canHelp && (
        <div className="flex flex-wrap gap-2 border-t border-border bg-white px-4 pt-3 sm:px-5">
          {[
            { label: tt.helpHint, msg: tt.helpHintMsg },
            { label: tt.helpExplain, msg: tt.helpExplainMsg },
            { label: tt.helpExample, msg: tt.helpExampleMsg },
          ].map((h, i) => (
            <button key={h.label} type="button" onClick={() => send(h.msg)} className="rounded-full border border-primary/40 bg-lavender px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary hover:text-white">
              {i + 1}. {h.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        className="border-t border-border bg-white p-4 sm:p-5"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        {notice && (
          <p role="status" className="mb-3 rounded-xl bg-warn-soft px-3 py-2 text-sm font-semibold text-warn">
            {notice}
          </p>
        )}
        <label htmlFor="tutor-input" className="sr-only">
          {tt.placeholder}
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="tutor-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            maxLength={MAX_MESSAGE_CHARS}
            placeholder={tt.placeholder}
            className="field min-h-[3.25rem] resize-y"
          />
          {busy ? (
            <button type="button" onClick={() => abortRef.current?.abort()} className={buttonClass("outline", "shrink-0")}>
              {tt.stop}
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()} className={buttonClass("primary", "shrink-0")}>
              {tt.send}
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{tt.disclaimer}</p>
          {messages.length > 0 && !busy && (
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setNotice(null);
                setShareState("idle");
              }}
              className="text-sm font-semibold text-primary underline underline-offset-4"
            >
              {tt.newChat}
            </button>
          )}
        </div>

        {shareStudentId && hasConversation && !busy && (
          <div className="mt-4 rounded-2xl bg-lavender p-3">
            {shareState === "done" ? (
              <p role="status" className="font-semibold text-ok">
                ✓ {tt.shareDone}
              </p>
            ) : shareState === "open" || shareState === "sending" || shareState === "error" ? (
              <div className="space-y-2">
                <label htmlFor="share-note" className="block text-sm font-semibold">
                  {tt.shareNote}
                </label>
                <input id="share-note" value={shareNote} onChange={(e) => setShareNote(e.target.value)} maxLength={1000} className="field" />
                {shareState === "error" && <p className="text-sm font-semibold text-danger">{tt.shareError}</p>}
                <button type="button" onClick={share} disabled={shareState === "sending"} className={buttonClass("primary")}>
                  {tt.share}
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setShareState("open")} className={buttonClass("soft", "bg-white")}>
                {tt.share}
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
