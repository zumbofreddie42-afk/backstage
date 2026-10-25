import type { Metadata } from "next";
import { RequestForm } from "@/components/request-form";
import { Card, Container, LinkButton, Notice, PageHero, Txt } from "@/components/ui";
import { t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { loadSite } from "@/server/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, d } = await loadSite((await params).lang);
  return pageMetadata(locale, "/placement-test", d.placement.title, d.placement.intro);
}

export default async function PlacementPage({ params }: { params: Promise<{ lang: string }> }) {
  const { content, mode, locale, d } = await loadSite((await params).lang);
  const preview = mode === "preview";
  const p = content.placement;

  return (
    <>
      <PageHero eyebrow={d.nav.placement} title={d.placement.title} intro={d.placement.intro}>
        <LinkButton href="#richiesta" variant="light" className="mt-8">
          {d.cta.requestTest}
        </LinkButton>
      </PageHero>

      <Container className="grid gap-10 py-16 lg:grid-cols-2">
        <section aria-labelledby="come">
          <h2 id="come" className="text-3xl font-extrabold text-ink">
            {d.placement.howTitle}
          </h2>
          <ol className="mt-6 space-y-4">
            {p.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-primary font-display font-extrabold text-primary">
                  {i + 1}
                </span>
                <span className="pt-1.5 text-lg">
                  <Txt text={t(step, locale)} preview={preview} />
                </span>
              </li>
            ))}
          </ol>
          <Notice className="mt-6">
            <Txt text={t(p.note, locale)} preview={preview} />
          </Notice>
        </section>
        <section aria-labelledby="cert">
          <Card className="h-full bg-muted">
            <h2 id="cert" className="text-2xl font-extrabold text-ink">
              {d.placement.certTitle}
            </h2>
            <p className="mt-3 text-lg">{d.placement.certText}</p>
            <LinkButton href={`/${locale}/area`} variant="soft" className="mt-5">
              {d.cta.studentArea}
            </LinkButton>
          </Card>
        </section>
      </Container>

      <section id="richiesta" aria-labelledby="richiesta-title" className="bg-lavender/50">
        <Container className="max-w-3xl py-16">
          <h2 id="richiesta-title" className="text-3xl font-extrabold text-ink">
            {d.placement.formTitle}
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">{d.placement.formIntro}</p>
          <div className="mt-6 rounded-3xl bg-white p-6 sm:p-8">
            <RequestForm d={d} locale={locale} defaultTopic="placement" withCertification idPrefix="pt" />
          </div>
        </Container>
      </section>
    </>
  );
}
