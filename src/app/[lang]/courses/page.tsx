import type { Metadata } from "next";
import clsx from "clsx";
import { Container, LinkButton, Notice, PageHero, RichText } from "@/components/ui";
import { t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { loadSite } from "@/server/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, d } = await loadSite((await params).lang);
  return pageMetadata(locale, "/courses", d.courses.title, d.courses.intro);
}

export default async function CoursesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { content, mode, locale, d } = await loadSite((await params).lang);
  const preview = mode === "preview";

  return (
    <>
      <PageHero eyebrow={d.nav.courses} title={d.courses.title} intro={d.courses.intro}>
        <nav aria-label={d.courses.jump} className="mt-8 flex flex-wrap gap-2">
          {content.courses.map((c) => (
            <a key={c.id} href={`#${c.id}`} className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white hover:text-primary">
              {t(c.title, locale)}
            </a>
          ))}
        </nav>
      </PageHero>

      <Container className="space-y-10 py-16">
        {content.courses.map((course, i) => {
          const kids = course.id === "young";
          return (
            <section
              key={course.id}
              id={course.id}
              aria-labelledby={`${course.id}-title`}
              className={clsx(
                "relative overflow-hidden rounded-[2rem] border-2 p-6 sm:p-10",
                kids ? "border-magenta bg-magenta-soft" : i % 2 ? "border-border bg-muted" : "border-border bg-white",
              )}
            >
              {kids && (
                <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 flex gap-2 text-5xl opacity-80">
                  <span className="rotate-12">⭐</span>
                  <span className="-rotate-6">🎈</span>
                </div>
              )}
              <p className={clsx("text-sm font-bold uppercase tracking-[0.12em] text-magenta-strong", kids && "font-kids normal-case tracking-normal text-base")}>
                {t(course.ages, locale)}
              </p>
              <h2 id={`${course.id}-title`} className={clsx("mt-2 text-3xl font-extrabold text-ink sm:text-4xl", kids && "font-kids")}>
                {t(course.title, locale)}
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-ink">{t(course.summary, locale)}</p>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className={clsx("rounded-2xl p-5", kids ? "bg-white" : "bg-lavender/60")}>
                  <h3 className={clsx("text-lg font-extrabold text-primary", kids && "font-kids")}>{d.courses.whatYouDo}</h3>
                  <RichText text={t(course.activities, locale)} preview={preview} className="mt-2" />
                </div>
                <div className={clsx("rounded-2xl p-5", kids ? "bg-white" : "bg-lavender/60")}>
                  <h3 className={clsx("text-lg font-extrabold text-primary", kids && "font-kids")}>{d.courses.goals}</h3>
                  <RichText text={t(course.goals, locale)} preview={preview} className="mt-2" />
                </div>
              </div>
              <LinkButton href={`/${locale}/contact?topic=courses&age=${course.id}`} variant={kids ? "magenta" : "primary"} className="mt-6">
                {d.courses.askInfo}
              </LinkButton>
            </section>
          );
        })}

        <Notice>{d.courses.noPrices}</Notice>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={`/${locale}/placement-test`}>{d.cta.requestTest}</LinkButton>
          <LinkButton href={`/${locale}/contact?topic=payments`} variant="outline">
            {d.cta.askPayments}
          </LinkButton>
        </div>
      </Container>
    </>
  );
}
