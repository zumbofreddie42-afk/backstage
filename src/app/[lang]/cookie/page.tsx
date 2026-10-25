import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { cookieSections } from "@/lib/content/legal";
import { pageMetadata } from "@/lib/seo";
import { loadSite } from "@/server/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, d } = await loadSite((await params).lang);
  return pageMetadata(locale, "/cookie", d.legal.cookieTitle, d.legal.cookieTitle);
}

export default async function CookiePage({ params }: { params: Promise<{ lang: string }> }) {
  const { mode, locale, d } = await loadSite((await params).lang);
  return <LegalPage title={d.legal.cookieTitle} draftNote={d.legal.draft} preview={mode === "preview"} sections={cookieSections(locale)} />;
}
