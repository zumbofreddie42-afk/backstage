import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { SiteContent } from "@/lib/content/schema";
import { getDictionary, isLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { getSiteMode, type SiteMode } from "@/server/config";
import { getStore } from "@/server/store";

export type Site = { content: SiteContent; mode: SiteMode; locale: Locale; d: Dictionary };

/** Content, mode and dictionary for the current request (deduplicated within one render). */
export const loadSite = cache(async (lang: string): Promise<Site> => {
  if (!isLocale(lang)) notFound();
  return { content: await getStore().getContent(), mode: getSiteMode(), locale: lang, d: getDictionary(lang) };
});
