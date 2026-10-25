import Link from "next/link";
import clsx from "clsx";
import { PLACEHOLDER_RE } from "@/lib/content/schema";

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[0.95rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const buttonStyles = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  magenta: "bg-magenta-strong text-white hover:bg-[#7f1f95]",
  outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
  light: "bg-white text-primary hover:bg-lavender",
  ghostLight: "border-2 border-white/80 text-white hover:bg-white hover:text-primary",
  soft: "bg-lavender text-primary hover:bg-[#e2d6fb]",
} as const;
export type ButtonVariant = keyof typeof buttonStyles;

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  return clsx(buttonBase, buttonStyles[variant], className);
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
  external,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass(variant, className)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={clsx("text-sm font-bold uppercase tracking-[0.14em] text-magenta-strong", className)}>{children}</p>;
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  id,
  className,
}: {
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={clsx("max-w-3xl", className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 id={id} className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
        {title}
      </h2>
      {intro && <div className="mt-3 text-lg text-muted-foreground">{intro}</div>}
    </div>
  );
}

/** Concentric rings echoing the round logo; decorative only. */
export function Rings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" focusable="false" className={className} fill="none">
      <circle cx="200" cy="200" r="190" stroke="currentColor" strokeWidth="18" />
      <circle cx="200" cy="200" r="140" stroke="currentColor" strokeWidth="4" strokeDasharray="2 14" strokeLinecap="round" />
      <circle cx="200" cy="200" r="104" fill="currentColor" fillOpacity="0.35" />
    </svg>
  );
}

/** A large rounded "B" used as a background motif (never as a replacement for the logo). */
export function BigB({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={clsx("pointer-events-none select-none font-display font-extrabold leading-none", className)}>
      B
    </span>
  );
}

export function PageHero({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-ink via-[#3b1f86] to-primary text-white">
      <Rings className="pointer-events-none absolute -right-28 -top-28 h-[24rem] w-[24rem] text-magenta/40" />
      <BigB className="absolute -bottom-16 right-[12%] hidden text-[18rem] text-white/[0.06] md:block" />
      <Container className="relative py-14 sm:py-20">
        {eyebrow && <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#f1c6fb]">{eyebrow}</p>}
        <h1 className="mt-3 max-w-4xl text-4xl font-extrabold sm:text-5xl">{title}</h1>
        {intro && <div className="mt-5 max-w-2xl text-lg text-ink-muted">{intro}</div>}
        {children}
      </Container>
    </section>
  );
}

export function Notice({ tone = "info", title, children, className }: { tone?: "info" | "ok" | "error" | "warn"; title?: string; children: React.ReactNode; className?: string }) {
  const styles = {
    info: "border-primary bg-lavender",
    ok: "border-ok bg-ok-soft",
    error: "border-danger bg-danger-soft",
    warn: "border-warn bg-warn-soft",
  }[tone];
  return (
    <div className={clsx("rounded-xl border-l-4 p-4", styles, className)} role={tone === "error" ? "alert" : undefined}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={clsx(title && "mt-1", "text-[0.95rem]")}>{children}</div>
    </div>
  );
}

function withPlaceholders(text: string, preview: boolean): React.ReactNode[] {
  const parts = text.split(/(\{\{[^}]+\}\})/g).filter(Boolean);
  return parts.map((part, i) =>
    PLACEHOLDER_RE.test(part) ? (
      preview ? (
        <span key={i} className="placeholder-mark" title="Segnaposto da completare">
          {part}
        </span>
      ) : null
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/**
 * Renders editable text: blank lines become paragraphs, {{PLACEHOLDERS}} are highlighted in preview
 * and removed in live mode (an all-placeholder text renders nothing).
 */
export function RichText({ text, preview, className }: { text: string; preview: boolean; className?: string }) {
  const cleaned = preview ? text : text.replace(/\{\{[^}]+\}\}/g, "").trim();
  if (!cleaned) return null;
  const paragraphs = cleaned.split(/\n\s*\n/);
  return (
    <div className={clsx("prose-bs", className)}>
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {withPlaceholders(p, preview)}
        </p>
      ))}
    </div>
  );
}

/** Inline version of RichText (no paragraphs). */
export function Txt({ text, preview }: { text: string; preview: boolean }) {
  if (!preview && !text.replace(/\{\{[^}]+\}\}/g, "").trim()) return null;
  return <>{withPlaceholders(text, preview)}</>;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("rounded-2xl border border-border bg-white p-6 shadow-[0_1px_0_rgba(36,19,71,0.04)]", className)}>{children}</div>;
}

export function Badge({ children, tone = "violet" }: { children: React.ReactNode; tone?: "violet" | "magenta" | "ok" | "warn" | "danger" | "gray" }) {
  const styles = {
    violet: "bg-lavender text-primary",
    magenta: "bg-magenta-soft text-magenta-strong",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
    gray: "bg-muted text-muted-foreground",
  }[tone];
  return <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", styles)}>{children}</span>;
}
