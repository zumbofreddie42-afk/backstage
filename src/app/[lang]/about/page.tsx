import type { Metadata } from "next";
import Image from "next/image";
import { Card, Container, Eyebrow, LinkButton, PageHero, RichText, Rings } from "@/components/ui";
import { t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { loadSite } from "@/server/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, d } = await loadSite((await params).lang);
  return pageMetadata(locale, "/about", `${d.about.title} · Christina Back`, d.about.intro);
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { content, mode, locale, d } = await loadSite((await params).lang);
  const preview = mode === "preview";
  const a = content.about;
  const sections = [
    { title: d.about.storyTitle, text: t(a.story, locale) },
    { title: d.about.approachTitle, text: t(a.approach, locale) },
    { title: d.about.roleTitle, text: t(a.role, locale) },
  ].filter((s) => preview || s.text.replace(/\{\{[^}]+\}\}/g, "").trim());
  const photos = a.photos.filter((p) => p.url);

  return (
    <>
      <PageHero eyebrow={d.meta.siteName} title={d.about.title} intro={d.about.intro} />

      <Container className="grid gap-12 py-16 lg:grid-cols-[22rem_1fr]">
        <div>
          <div className="relative mx-auto aspect-square w-full max-w-[22rem]">
            <Rings className="absolute inset-0 h-full w-full text-magenta" />
            <div className="absolute inset-[11%] overflow-hidden rounded-full bg-lavender">
              {a.portrait.url ? (
                <Image src={a.portrait.url} alt={t(a.portrait.alt, locale)} fill sizes="(min-width: 1024px) 18rem, 70vw" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center text-sm font-semibold text-primary">
                  {preview ? `{{FOTO DI CHRISTINA BACK}} — ${d.about.photoPlaceholder}` : ""}
                </div>
              )}
            </div>
          </div>
          {t(a.portrait.caption, locale) && <p className="mt-3 text-center text-sm text-muted-foreground">{t(a.portrait.caption, locale)}</p>}
        </div>

        <div>
          <Eyebrow>{d.about.christinaEyebrow}</Eyebrow>
          <h2 className="mt-2 text-4xl font-extrabold text-ink">Christina Back</h2>
          <div className="mt-8 space-y-10">
            {sections.map((s) => (
              <section key={s.title}>
                <h3 className="text-2xl font-extrabold text-primary">{s.title}</h3>
                <RichText text={s.text} preview={preview} className="mt-3 text-lg" />
              </section>
            ))}
          </div>
        </div>
      </Container>

      <section className="bg-muted">
        <Container className="py-16">
          <h2 className="text-3xl font-extrabold text-ink">{d.about.methodTitle}</h2>
          <RichText text={t(a.method, locale)} preview={preview} className="mt-4 max-w-3xl text-lg" />
        </Container>
      </section>

      {(photos.length > 0 || preview) && (
        <Container className="py-16">
          <h2 className="text-3xl font-extrabold text-ink">{d.about.photosTitle}</h2>
          {photos.length > 0 ? (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((p) => (
                <li key={p.id}>
                  <figure>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-lavender">
                      <Image src={p.url} alt={t(p.alt, locale)} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                    </div>
                    {t(p.caption, locale) && <figcaption className="mt-2 text-sm text-muted-foreground">{t(p.caption, locale)}</figcaption>}
                  </figure>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mt-8 grid gap-5 sm:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <li key={n} className="flex aspect-[4/3] items-center justify-center rounded-3xl border-2 border-dashed border-magenta bg-magenta-soft p-6 text-center text-sm font-semibold text-magenta-strong">
                  {`{{FOTO ${n}}}`} — {d.about.photoPlaceholder}
                </li>
              ))}
            </ul>
          )}
        </Container>
      )}

      <Container className="pb-4">
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-semibold text-ink">{d.home.contactText}</p>
          <LinkButton href={`/${locale}/contact`}>{d.cta.contact}</LinkButton>
        </Card>
      </Container>
    </>
  );
}
