"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container, buttonClass } from "@/components/ui";
import { getDictionary } from "@/lib/i18n";

export default function NotFound() {
  const locale = usePathname()?.startsWith("/en") ? "en" : "it";
  const d = getDictionary(locale);
  return (
    <Container className="py-24 text-center">
      <p className="font-display text-7xl font-extrabold text-lavender">404</p>
      <h1 className="mt-4 text-4xl font-extrabold text-ink">{d.notFound.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{d.notFound.text}</p>
      <Link href={`/${locale}`} className={buttonClass("primary", "mt-8")}>
        {d.notFound.back}
      </Link>
    </Container>
  );
}
