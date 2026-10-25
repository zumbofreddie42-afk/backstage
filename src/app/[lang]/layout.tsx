import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { fontVariables } from "@/app/fonts";
import { FloatingContact, SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getDictionary, isLocale, LOCALES } from "@/lib/i18n";
import { getSiteMode, getSiteUrl } from "@/server/config";
import { loadSite } from "@/server/site";
import "../globals.css";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = getDictionary(lang);
  const preview = getSiteMode() === "preview";
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: d.meta.defaultTitle, template: `%s · Backstage Languages` },
    description: d.meta.description,
    applicationName: d.meta.siteName,
    openGraph: { type: "website", siteName: d.meta.siteName, locale: d.meta.ogLocale, description: d.meta.description },
    formatDetection: { telephone: false },
    // In anteprima il sito non va indicizzato: i dati non sono ancora verificati.
    robots: preview ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#5a33cc",
};

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const site = await loadSite(lang);
  const { d } = site;
  return (
    <html lang={lang} className={fontVariables} data-scroll-behavior="smooth">
      <body className="flex min-h-dvh flex-col">
        {site.mode === "preview" && (
          <p className="bg-magenta-soft px-4 py-1.5 text-center text-xs font-semibold text-magenta-strong">{d.preview.banner}</p>
        )}
        <SiteHeader d={d} locale={lang} />
        <main id="contenuto" className="flex-1">
          {children}
        </main>
        <SiteFooter site={site} />
        <FloatingContact label={d.cta.contact} locale={lang} />
      </body>
    </html>
  );
}
