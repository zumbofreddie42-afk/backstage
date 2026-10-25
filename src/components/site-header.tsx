"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import type { Dictionary, Locale } from "@/lib/i18n";
import { buttonClass } from "@/components/ui";
import { navItems } from "@/lib/nav";

export function Logo({ locale, name }: { locale: Locale; name: string }) {
  return (
    <Link href={`/${locale}`} className="flex shrink-0 items-center gap-2.5 rounded-full" aria-label={`${name} – Home`}>
      <Image src="/brand/backstage-logo.jpg" alt="" width={150} height={150} priority className="h-12 w-12 rounded-full" />
      <span className="hidden font-display text-[1.02rem] font-extrabold leading-tight text-ink sm:block">
        Backstage
        <span className="block text-xs font-semibold tracking-wide text-magenta-strong">Online Languages</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ d, locale }: { d: Dictionary; locale: Locale }) {
  const pathname = usePathname() ?? `/${locale}`;
  const [open, setOpen] = useState(false);
  const rest = pathname.replace(/^\/(it|en)(?=\/|$)/, "");
  const other: Locale = locale === "it" ? "en" : "it";
  const items = navItems(d);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (path: string) => rest === path || rest.startsWith(`${path}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <a href="#contenuto" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-white">
        {d.nav.skipToContent}
      </a>
      <div className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo locale={locale} name={d.meta.siteName} />
        <nav aria-label={d.nav.mainNav} className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.path}>
                <Link
                  href={`/${locale}${item.path}`}
                  aria-current={isActive(item.path) ? "page" : undefined}
                  className={clsx(
                    "rounded-full px-3 py-2 text-[0.93rem] font-semibold transition-colors hover:bg-lavender hover:text-primary",
                    isActive(item.path) ? "bg-lavender text-primary" : "text-ink",
                    item.path === "/ai-tutor" && "text-magenta-strong",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={`/${other}${rest}`}
            hrefLang={other}
            lang={other}
            className="inline-flex min-h-11 items-center rounded-full border border-border px-3 text-sm font-bold text-ink hover:border-primary hover:text-primary"
            title={d.nav.switchLanguage}
          >
            <span className="sr-only">{d.nav.switchLanguage}: </span>
            {other.toUpperCase()}
          </Link>
          <Link href={`/${locale}/area`} className={buttonClass("primary", "px-4 max-sm:hidden")}>
            {d.nav.studentArea}
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-bold text-ink xl:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen(true)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            {d.nav.menu}
          </button>
        </div>
      </div>

      {open && (
        <div id="menu-mobile" role="dialog" aria-modal="true" aria-label={d.nav.menu} className="fixed inset-0 z-50 xl:hidden">
          <button type="button" className="absolute inset-0 bg-ink/50" aria-label={d.nav.closeMenu} onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-[min(22rem,88vw)] flex-col overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo locale={locale} name={d.meta.siteName} />
              <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-bold" autoFocus>
                {d.nav.closeMenu}
              </button>
            </div>
            <ul className="mt-6 space-y-1">
              {[{ path: "", label: d.nav.home }, ...items].map((item) => (
                <li key={item.path || "home"}>
                  <Link
                    href={`/${locale}${item.path}`}
                    onClick={() => setOpen(false)}
                    aria-current={(item.path ? isActive(item.path) : rest === "") ? "page" : undefined}
                    className="block rounded-xl px-4 py-3 text-lg font-semibold text-ink hover:bg-lavender aria-[current=page]:bg-lavender aria-[current=page]:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto space-y-2 pt-6">
              <Link href={`/${locale}/area`} onClick={() => setOpen(false)} className={buttonClass("primary", "w-full")}>
                {d.cta.studentArea}
              </Link>
              <Link href={`/${locale}/contact`} onClick={() => setOpen(false)} className={buttonClass("outline", "w-full")}>
                {d.cta.contact}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/** Always-visible contact shortcut (hidden where it would cover the form or the chat). */
export function FloatingContact({ label, locale }: { label: string; locale: Locale }) {
  const pathname = usePathname() ?? "";
  if (/\/(contact|ai-tutor|area)(\/|$)/.test(pathname)) return null;
  return (
    <Link
      href={`/${locale}/contact`}
      className="fixed bottom-4 right-4 z-30 inline-flex min-h-12 items-center gap-2 rounded-full bg-magenta-strong px-5 font-semibold text-white shadow-lg shadow-ink/20 hover:bg-[#7f1f95]"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
      </svg>
      {label}
    </Link>
  );
}
