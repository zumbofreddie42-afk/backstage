import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { privacySections } from "@/lib/content/legal";
import { pageMetadata } from "@/lib/seo";
import { loadSite } from "@/server/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, d } = await loadSite((await params).lang);
  return pageMetadata(locale, "/privacy", d.legal.privacyTitle, d.legal.privacyTitle);
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { content, mode, locale, d } = await loadSite((await params).lang);
  return <LegalPage title={d.legal.privacyTitle} draftNote={d.legal.draft} preview={mode === "preview"} sections={privacySections(content, locale)} />;
}
