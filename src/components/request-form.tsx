"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { submitRequest, type RequestFormState } from "@/app/[lang]/request-actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import { buttonClass } from "@/components/ui";

type Topic = keyof Dictionary["form"]["topics"];

export function RequestForm({
  d,
  locale,
  defaultTopic = "courses",
  defaultAge = "",
  withCertification = false,
  idPrefix = "rf",
}: {
  d: Dictionary;
  locale: Locale;
  defaultTopic?: Topic;
  defaultAge?: string;
  withCertification?: boolean;
  idPrefix?: string;
}) {
  const [state, action, pending] = useActionState<RequestFormState, FormData>(submitRequest, { status: "idle" });
  const statusRef = useRef<HTMLDivElement>(null);
  const f = d.form;
  const err = state.errors ?? {};
  const id = (name: string) => `${idPrefix}-${name}`;
  const v = (name: string) => (typeof state.values?.[name] === "string" ? (state.values[name] as string) : undefined);

  useEffect(() => {
    if (state.status !== "idle") statusRef.current?.focus();
  }, [state]);

  if (state.status === "ok") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-2xl border-l-4 border-ok bg-ok-soft p-5 text-lg font-semibold text-ok">
        {f.success}
      </div>
    );
  }

  const label = (name: string, text: string, required = false) => (
    <label htmlFor={id(name)} className="block font-semibold text-ink">
      {text}
      {required && <span className="text-danger" aria-hidden="true"> *</span>}
      {required && <span className="sr-only"> ({f.required})</span>}
    </label>
  );
  const error = (name: keyof typeof err, text: string) =>
    err[name] ? (
      <p id={id(`${name}-err`)} className="mt-1 text-sm font-semibold text-danger">
        {text}
      </p>
    ) : null;

  return (
    <form action={action} noValidate className="space-y-5">
      <div ref={statusRef} tabIndex={-1} aria-live="polite">
        {state.status === "error" && (
          <p role="alert" className="rounded-xl bg-danger-soft p-3 font-semibold text-danger">
            {state.rateLimited ? f.errorRate : f.errorGeneric}
          </p>
        )}
      </div>
      <input type="hidden" name="locale" value={locale} />
      <div className="hidden" aria-hidden="true">
        <label htmlFor={id("website")}>{f.honeypot}</label>
        <input id={id("website")} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          {label("name", f.name, true)}
          <input id={id("name")} name="name" defaultValue={v("name")} autoComplete="name" required className="field mt-1" aria-invalid={err.name || undefined} aria-describedby={err.name ? id("name-err") : undefined} />
          {error("name", f.errors.name)}
        </div>
        <div>
          {label("email", f.email, true)}
          <input id={id("email")} name="email" defaultValue={v("email")} type="email" autoComplete="email" required className="field mt-1" aria-invalid={err.email || undefined} aria-describedby={err.email ? id("email-err") : undefined} />
          {error("email", f.errors.email)}
        </div>
        <div>
          {label("phone", f.phone)}
          <input id={id("phone")} name="phone" defaultValue={v("phone")} type="tel" autoComplete="tel" className="field mt-1" />
        </div>
        <div>
          {label("ageBand", f.ageBand)}
          <select id={id("ageBand")} name="ageBand" defaultValue={v("ageBand") ?? defaultAge} className="field mt-1">
            <option value="">{f.chooseAgeBand}</option>
            {(["young", "middle", "high", "adults", "unsure"] as const).map((band) => (
              <option key={band} value={band}>
                {d.ageBands[band]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        {label("topic", f.topic)}
        <select id={id("topic")} name="topic" defaultValue={v("topic") ?? defaultTopic} className="field mt-1">
          {(Object.keys(f.topics) as Topic[]).map((topic) => (
            <option key={topic} value={topic}>
              {f.topics[topic]}
            </option>
          ))}
        </select>
      </div>

      <div>
        {label("message", f.message, true)}
        <textarea id={id("message")} name="message" defaultValue={v("message")} rows={5} required className="field mt-1" aria-invalid={err.message || undefined} aria-describedby={err.message ? id("message-err") : undefined} />
        {error("message", f.errors.message)}
      </div>

      {withCertification && (
        <fieldset className="space-y-4 rounded-2xl border border-border bg-muted p-4">
          <legend className="px-1 font-semibold text-ink">{d.placement.certTitle}</legend>
          <div>
            {label("certificationTitle", d.placement.certName)}
            <input id={id("certificationTitle")} name="certificationTitle" defaultValue={v("certificationTitle")} className="field mt-1" aria-describedby={id("certificationTitle-hint")} />
            <p id={id("certificationTitle-hint")} className="mt-1 text-sm text-muted-foreground">
              {d.placement.certNameHint}
            </p>
          </div>
          <div>
            {label("certification", d.placement.certFile)}
            <input
              id={id("certification")}
              name="certification"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-white"
              aria-invalid={err.file || undefined}
              aria-describedby={err.file ? id("file-err") : undefined}
            />
            {error("file", f.errors.file)}
          </div>
        </fieldset>
      )}

      <label className="flex items-start gap-3">
        <input type="checkbox" name="minor" defaultChecked={state.values?.minor === true} className="mt-1 h-5 w-5 shrink-0 accent-primary" />
        <span>{f.studentIsMinor}</span>
      </label>

      <div>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="consent" defaultChecked={state.values?.consent === true} required className="mt-1 h-5 w-5 shrink-0 accent-primary" aria-invalid={err.consent || undefined} aria-describedby={err.consent ? id("consent-err") : undefined} />
          <span>
            {f.consent}{" "}
            <Link href={`/${locale}/privacy`} className="font-semibold text-primary underline" target="_blank">
              {f.privacyLink}
            </Link>
            <span className="text-danger" aria-hidden="true"> *</span>
          </span>
        </label>
        {error("consent", f.errors.consent)}
      </div>

      <button type="submit" disabled={pending} className={buttonClass("primary", "w-full sm:w-auto")}>
        {pending ? f.submitting : f.submit}
      </button>
    </form>
  );
}
