import type { Metadata } from "next";
import { RequestForm } from "@/components/request-form";
import { Card, Container, LinkButton, PageHero, Txt } from "@/components/ui";
import { isAgeBand, isPlaceholder } from "@/lib/content/schema";
import { phoneHref, socialLinks, whatsappHref } from "@/lib/contact";
import { t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { loadSite } from "@/server/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, d } = await loadSite((await params).lang);
  return pageMetadata(locale, "/contact", d.contact.title, d.contact.intro);
}

const TOPICS = ["courses", "payments", "placement", "trip", "other"] as const;

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ topic?: string; age?: string }>;
}) {
  const { content, mode, locale, d } = await loadSite((await params).lang);
  const sp = await searchParams;
  const preview = mode === "preview";
  const c = content.contact;
  const topic = TOPICS.find((x) => x === sp.topic) ?? "courses";
  const age = isAgeBand(sp.age) ? sp.age : "";
  const wa = whatsappHref(c.whatsapp);
  const socials = socialLinks(c);

  const rows = [
    { label: d.contact.email, value: c.email, href: isPlaceholder(c.email) ? null : `mailto:${c.email}` },
    { label: d.contact.phone, value: c.phone, href: isPlaceholder(c.phone) ? null : phoneHref(c.phone) },
    { label: d.contact.address, value: t(c.address, locale), href: null },
    { label: d.contact.hours, value: t(c.hours, locale), href: null },
  ].filter((r) => preview || !isPlaceholder(r.value));

  return (
    <>
      <PageHero eyebrow={d.nav.contact} title={d.contact.title} intro={d.contact.intro} />
      <Container className="grid gap-10 py-16 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="form-title">
          <h2 id="form-title" className="text-3xl font-extrabold text-ink">
            {d.contact.formTitle}
          </h2>
          <div className="mt-6">
            <RequestForm d={d} locale={locale} defaultTopic={topic} defaultAge={age} />
          </div>
        </section>
        <aside className="space-y-5">
          <Card>
            <h2 className="text-xl font-extrabold text-ink">{d.contact.detailsTitle}</h2>
            <dl className="mt-4 space-y-3">
              {rows.map((r) => (
                <div key={r.label}>
                  <dt className="text-sm font-semibold text-muted-foreground">{r.label}</dt>
                  <dd className="font-semibold text-ink">
                    {r.href ? (
                      <a href={r.href} className="text-primary underline underline-offset-4">
                        {r.value}
                      </a>
                    ) : (
                      <Txt text={r.value} preview={preview} />
                    )}
                  </dd>
                </div>
              ))}
              {(socials.length > 0 || preview) && (
                <div>
                  <dt className="text-sm font-semibold text-muted-foreground">{d.contact.socials}</dt>
                  <dd className="font-semibold">
                    {socials.length > 0 ? (
                      <ul className="flex flex-wrap gap-x-3">
                        {socials.map((s) => (
                          <li key={s.name}>
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
                              {s.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Txt text="{{PROFILI SOCIAL UFFICIALI}}" preview={preview} />
                    )}
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-5 flex flex-col gap-2">
              {wa && (
                <LinkButton href={wa} variant="magenta" external>
                  {d.cta.whatsapp}
                </LinkButton>
              )}
              {!isPlaceholder(c.phone) && (
                <LinkButton href={phoneHref(c.phone)} variant="outline">
                  {d.cta.call}
                </LinkButton>
              )}
            </div>
          </Card>
          <Card className="bg-lavender">
            <p className="font-semibold text-ink">{d.courses.noPrices}</p>
          </Card>
        </aside>
      </Container>
    </>
  );
}
