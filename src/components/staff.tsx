import Link from "next/link";
import clsx from "clsx";
import { buttonClass } from "@/components/ui";

/** Small building blocks for the staff panel (Italian only). */

export function StaffPage({ title, intro, actions, children }: { title: string; intro?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
          {intro && <div className="mt-1 max-w-3xl text-muted-foreground">{intro}</div>}
        </div>
        {actions}
      </div>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  );
}

export function Panel({ title, id, children, className, aside }: { title?: string; id?: string; children: React.ReactNode; className?: string; aside?: React.ReactNode }) {
  return (
    <section id={id} className={clsx("scroll-mt-6 rounded-2xl border border-border bg-white p-5 sm:p-6", className)}>
      {(title || aside) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-xl font-extrabold text-ink">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SubmitButton({ children, variant = "primary", small }: { children: React.ReactNode; variant?: "primary" | "outline" | "soft" | "magenta"; small?: boolean }) {
  return (
    <button type="submit" className={buttonClass(variant, small ? "min-h-9 px-4 py-1.5 text-sm" : undefined)}>
      {children}
    </button>
  );
}

export function DangerButton({ children, confirmText }: { children: React.ReactNode; confirmText?: string }) {
  return (
    <button
      type="submit"
      title={confirmText}
      className="inline-flex min-h-9 items-center rounded-full border border-danger/40 px-3 py-1 text-sm font-semibold text-danger hover:bg-danger-soft"
    >
      {children}
    </button>
  );
}

export function Flash({ message, tone = "ok" }: { message?: string | null; tone?: "ok" | "error" }) {
  if (!message) return null;
  return (
    <p role={tone === "error" ? "alert" : "status"} className={clsx("rounded-xl p-3 font-semibold", tone === "ok" ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger")}>
      {message}
    </p>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>;
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-semibold text-primary underline underline-offset-4">
      ← {children}
    </Link>
  );
}
