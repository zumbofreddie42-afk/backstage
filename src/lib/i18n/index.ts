import { it } from "./it";
import { en } from "./en";

export const LOCALES = ["it", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "it";

export type Dictionary = typeof it;

const dictionaries: Record<Locale, Dictionary> = { it, en };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "it" || value === "en";
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Bilingual text stored in the editable content. */
export type L = { it: string; en: string };

/** Picks the requested language, falling back to Italian when the English text is still empty. */
export function t(text: L, locale: Locale): string {
  return (locale === "en" ? text.en : text.it).trim() || text.it;
}

/** Locale-prefixed path: href("en", "/courses") → "/en/courses". */
export function href(locale: Locale, path = ""): string {
  const clean = path === "/" ? "" : path;
  return `/${locale}${clean}`;
}

export function otherLocale(locale: Locale): Locale {
  return locale === "it" ? "en" : "it";
}
