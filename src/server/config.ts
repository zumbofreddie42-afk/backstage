import "server-only";

export type SiteMode = "preview" | "live";

/**
 * Preview (default) shows {{placeholders}} with clear markers, enables the demo accounts and asks
 * search engines not to index the site. Set SITE_MODE=live only after the school has checked the content.
 */
export function getSiteMode(): SiteMode {
  return process.env.SITE_MODE === "live" ? "live" : "preview";
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/** The AI tutor is live when an Anthropic API key is configured; otherwise it runs in demo mode. */
export function isTutorLive(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** "students" (default): only signed-in students/guardians use the live AI; visitors see the demo. */
export function tutorAccess(): "students" | "public" {
  return process.env.TUTOR_ACCESS === "public" ? "public" : "students";
}

export function tutorModel(): string {
  return process.env.TUTOR_MODEL?.trim() || "claude-opus-5-5";
}

export type StoreKind = "memory" | "local";

export function getStoreKind(): StoreKind {
  return process.env.BACKSTAGE_STORE === "memory" ? "memory" : "local";
}
