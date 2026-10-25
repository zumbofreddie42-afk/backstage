import Link from "next/link";
import { isPlaceholder } from "@/lib/content/schema";
import type { Site } from "@/server/site";
import { t } from "@/lib/i18n";
import { Container, LinkButton, Txt } from "@/components/ui";
import { navItems } from "@/lib/nav";
import { phoneHref, socialLinks, whatsappHref } from "@/lib/contact";

export function SiteFooter({ site }: { site: Site }) {
  const { d, locale, content, mode } = site;
  const preview = mode === "preview";
  const c = content.contact;
  const socials = socialLinks(c);
  const year = new Date().getFullYear();
  return (
    <footer className="mt-8 bg-ink text-ink-foreground">
      <Container className="py-14">
        <div className="flex flex-col gap-6 rounded-3xl bg-white/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-display text-2xl font-extrabold">{d.home.contactTitle}</p>
            <p className="mt-1 text-ink-muted">{d.home.contactText}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href={`/${locale}/contact?topic=payments`} variant="light">
              {d.cta.askPayments}
            </LinkButton>
            {whatsappHref(c.whatsapp) && (
              <LinkButton href={whatsappHref(c.whatsapp)!} variant="ghostLight" external>
                {d.cta.whatsapp}
              </LinkButton>
            )}
          </div>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-xl font-extrabold">Backstage Online Languages</p>
            <p className="mt-2 text-ink-muted">{d.footer.tagline}</p>
          </div>
          <div>
            <p className="font-bold">{d.footer.explore}</p>
            <ul className="mt-3 space-y-2 text-ink-muted">
              {navItems(d).map((item) => (
                <li key={item.path}>
                  <Link href={`/${locale}${item.path}`} className="hover:text-white hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold">{d.contact.detailsTitle}</p>
            <ul className="mt-3 space-y-2 text-ink-muted">
              {(preview || !isPlaceholder(c.email)) && (
                <li>
                  {d.contact.email}:{" "}
                  {isPlaceholder(c.email) ? <Txt text={c.email} preview={preview} /> : <a className="underline hover:text-white" href={`mailto:${c.email}`}>{c.email}</a>}
                </li>
              )}
              {(preview || !isPlaceholder(c.phone)) && (
                <li>
                  {d.contact.phone}:{" "}
                  {isPlaceholder(c.phone) ? <Txt text={c.phone} preview={preview} /> : <a className="underline hover:text-white" href={phoneHref(c.phone)}>{c.phone}</a>}
                </li>
              )}
              {(preview || !isPlaceholder(t(c.address, locale))) && (
                <li>
                  <Txt text={t(c.address, locale)} preview={preview} />
                </li>
              )}
              {socials.map((s) => (
                <li key={s.name}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold">{d.footer.legal}</p>
            <ul className="mt-3 space-y-2 text-ink-muted">
              <li>
                <Link href={`/${locale}/privacy`} className="hover:text-white hover:underline">
                  {d.footer.privacy}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/cookie`} className="hover:text-white hover:underline">
                  {d.footer.cookie}
                </Link>
              </li>
              <li>
                <Link href="/staff" className="hover:text-white hover:underline" prefetch={false}>
                  {d.footer.staff}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-12 border-t border-white/15 pt-6 text-sm text-ink-muted">
          © {year} <Txt text={content.legal.owner} preview={preview} /> · P. IVA <Txt text={content.legal.vat} preview={preview} /> · {d.footer.rights}
        </p>
      </Container>
    </footer>
  );
}
