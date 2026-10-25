import type { Metadata } from "next";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getDictionary(lang).area.title : undefined, robots: { index: false, follow: false } };
}

export default function AreaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
