import type { Metadata } from "next";
import { ResourceLibrary } from "@/components/resource-library";
import { Container, Notice, PageHero, SectionHeading } from "@/components/ui";
import { visibleBooks, visibleResources } from "@/lib/content/visibility";
import { t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { loadSite } from "@/server/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, d } = await loadSite((await params).lang);
  return pageMetadata(locale, "/resources", d.resources.title, d.resources.intro);
}

export default async function ResourcesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { content, locale, d } = await loadSite((await params).lang);
  const resources = visibleResources(content.resources).map((r) => ({
    id: r.id,
    title: t(r.title, locale),
    description: t(r.description, locale),
    url: r.url,
    ageBand: r.ageBand,
    level: r.level,
    topic: t(r.topic, locale),
  }));
  const books = visibleBooks(content.books);
  const ageLabels: Record<string, string> = { ...d.ageBands };

  return (
    <>
      <PageHero eyebrow={d.nav.resources} title={d.resources.title} intro={d.resources.intro} />
      <Container className="py-16">
        {resources.length > 0 ? (
          <ResourceLibrary
            items={resources}
            ageLabels={ageLabels}
            labels={{
              filterAge: d.resources.filterAge,
              filterLevel: d.resources.filterLevel,
              filterTopic: d.resources.filterTopic,
              all: d.resources.all,
              empty: d.resources.empty,
              open: d.resources.open,
            }}
          />
        ) : (
          <Notice>{d.resources.noResources}</Notice>
        )}
      </Container>

      <section aria-labelledby="libri" className="bg-muted">
        <Container className="py-16">
          <SectionHeading id="libri" title={d.resources.booksTitle} />
          {books.length === 0 ? (
            <p className="mt-6 text-muted-foreground">{d.resources.booksEmpty}</p>
          ) : (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((b) => (
                <li key={b.id} className="flex flex-col rounded-2xl bg-white p-5">
                  <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                    {b.ageBand !== "all" && <span className="rounded-full bg-lavender px-2.5 py-0.5 text-primary">{ageLabels[b.ageBand]}</span>}
                    {b.level && <span className="rounded-full bg-magenta-soft px-2.5 py-0.5 text-magenta-strong">{b.level}</span>}
                  </div>
                  <h3 className="mt-3 text-lg font-extrabold text-ink">{b.title}</h3>
                  {b.author && <p className="text-muted-foreground">{b.author}</p>}
                  {t(b.note, locale) && <p className="mt-2 flex-1">{t(b.note, locale)}</p>}
                  <a
                    href={b.amazonUrl}
                    target="_blank"
                    rel={`noopener noreferrer${content.amazon.affiliate ? " sponsored" : ""}`}
                    className="mt-4 font-semibold text-primary underline underline-offset-4"
                  >
                    {d.resources.onAmazon} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
          {content.amazon.affiliate && books.length > 0 && <p className="mt-6 text-sm text-muted-foreground">{t(content.amazon.disclosure, locale)}</p>}
        </Container>
      </section>
    </>
  );
}
