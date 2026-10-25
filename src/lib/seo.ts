import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";

/** Per-page metadata with canonical URL and hreflang alternates (it/en). */
export function pageMetadata(locale: Locale, path: string, title: string | null, description: string): Metadata {
  return {
    ...(title ? { title } : {}),
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { it: `/it${path}`, en: `/en${path}`, "x-default": `/it${path}` },
    },
    openGraph: { description, url: `/${locale}${path}`, locale: locale === "it" ? "it_IT" : "en_GB", ...(title ? { title } : {}) },
  };
}
