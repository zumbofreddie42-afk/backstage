import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { BigB, Container, LinkButton, RichText, Rings, SectionHeading, Txt } from "@/components/ui";
import { t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { visibleTestimonials } from "@/lib/content/visibility";
import { loadSite } from "@/server/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, d } = await loadSite((await params).lang);
  return pageMetadata(locale, "", null, d.meta.description);
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { content, mode, locale, d } = await loadSite((await params).lang);
  const preview = mode === "preview";
  const home = content.home;
  const testimonials = visibleTestimonials(content.testimonials, mode);
  const L = (p: string) => `/${locale}${p}`;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <Rings className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] text-lavender" />
        <Rings className="pointer-events-none absolute -bottom-48 -right-32 h-[34rem] w-[34rem] text-magenta-soft" />
        <Container className="relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-magenta-strong">{d.home.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-extrabold text-ink sm:text-5xl lg:text-[3.6rem]">
              <Txt text={t(home.heroTitle, locale)} preview={preview} />
            </h1>
            <div className="mt-5 max-w-xl text-lg text-muted-foreground">
              <Txt text={t(home.heroText, locale)} preview={preview} />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href={L("/contact")}>{d.cta.contact}</LinkButton>
              <LinkButton href={L("/courses")} variant="outline">
                {d.cta.discoverCourses}
              </LinkButton>
              <LinkButton href={L("/area")} variant="soft">
                {d.cta.studentArea}
              </LinkButton>
            </div>
          </div>

          {/* AI tutor teaser: one of the main features, visible right away. */}
          <div className="relative">
            <div className="relative rounded-[2rem] bg-gradient-to-br from-primary to-magenta-strong p-1 shadow-xl shadow-primary/20">
              <div className="rounded-[1.8rem] bg-white p-6">
                <div className="flex items-center gap-3">
                  <Image src="/brand/backstage-logo.jpg" alt="" width={150} height={150} className="h-12 w-12 rounded-full" />
                  <div>
                    <p className="font-display text-lg font-extrabold text-ink">{d.home.tutorCardTitle}</p>
                    <p className="text-sm text-muted-foreground">{d.cta.homeworkHelp}</p>
                  </div>
                </div>
                <p className="mt-4 text-[0.95rem] text-muted-foreground">{d.home.tutorCardText}</p>
                <ul className="mt-4 space-y-2">
                  {d.tutor.starters.map((s) => (
                    <li key={s}>
                      <Link
                        href={`${L("/ai-tutor")}?q=${encodeURIComponent(s)}#chat`}
                        className="block rounded-2xl border border-border bg-muted px-4 py-2.5 text-[0.95rem] font-medium text-ink hover:border-primary hover:bg-lavender"
                      >
                        {s}
                      </Link>
                    </li>
                  ))}
                </ul>
                <LinkButton href={`${L("/ai-tutor")}#chat`} variant="magenta" className="mt-5 w-full">
                  {d.cta.askAI}
                </LinkButton>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Intro + experience */}
      <section className="bg-muted">
        <Container className="grid items-center gap-10 py-14 md:grid-cols-[auto_1fr]">
          <div className="relative mx-auto flex h-48 w-48 flex-col items-center justify-center rounded-full border-[10px] border-primary bg-white text-center">
            <span className="font-display text-5xl font-extrabold text-primary">{home.years}</span>
            <span className="mt-1 max-w-[8.5rem] text-xs font-semibold leading-snug text-muted-foreground">{d.home.experienceLabel}</span>
          </div>
          <div>
            <RichText text={t(home.intro, locale)} preview={preview} className="text-lg text-ink" />
            <Link href={L("/about")} className="mt-4 inline-block font-semibold text-primary underline underline-offset-4">
              {d.cta.readMore}: {d.nav.about}
            </Link>
          </div>
        </Container>
      </section>

      {/* AI tutor, placement test, study trips */}
      <section aria-labelledby="inizia" className="relative overflow-hidden bg-ink text-white">
        <BigB className="absolute -right-10 -top-20 text-[22rem] text-white/[0.05]" />
        <Container className="relative py-16">
          <h2 id="inizia" className="text-3xl font-extrabold sm:text-4xl">
            {d.home.startTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-ink-muted">{d.home.startIntro}</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { title: d.home.tutorCardTitle, text: d.home.tutorCardText, href: L("/ai-tutor"), cta: d.cta.askAI, accent: true },
              { title: d.home.testCardTitle, text: d.home.testCardText, href: L("/placement-test"), cta: d.cta.requestTest, accent: false },
              { title: d.home.tripsCardTitle, text: d.home.tripsCardText, href: L("/study-trips"), cta: d.cta.readMore, accent: false },
            ].map((card) => (
              <div key={card.title} className={clsx("flex flex-col rounded-3xl p-6", card.accent ? "bg-gradient-to-br from-magenta-strong to-primary" : "bg-white/[0.07]")}>
                <h3 className="text-xl font-extrabold">{card.title}</h3>
                <p className="mt-2 flex-1 text-ink-muted">{card.text}</p>
                <LinkButton href={card.href} variant={card.accent ? "light" : "ghostLight"} className="mt-5 self-start">
                  {card.cta}
                </LinkButton>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Paths by age */}
      <section aria-labelledby="percorsi">
        <Container className="py-16">
          <SectionHeading id="percorsi" eyebrow={d.nav.courses} title={d.home.pathsTitle} intro={d.home.pathsIntro} />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {content.courses.map((course) => {
              const kids = course.id === "young";
              return (
                <li key={course.id}>
                  <Link
                    href={`${L("/courses")}#${course.id}`}
                    className={clsx(
                      "group flex h-full flex-col rounded-3xl border-2 p-6 transition-colors",
                      kids ? "border-magenta bg-magenta-soft hover:border-magenta-strong" : "border-border bg-white hover:border-primary",
                    )}
                  >
                    <span className={clsx("text-sm font-bold", kids ? "font-kids text-magenta-strong" : "text-magenta-strong")}>
                      {t(course.ages, locale)}
                    </span>
                    <span className={clsx("mt-2 text-2xl font-extrabold text-ink", kids ? "font-kids" : "font-display")}>
                      {t(course.title, locale)}
                      {kids && <span aria-hidden="true"> ✨</span>}
                    </span>
                    <span className="mt-3 flex-1 text-[0.95rem] text-muted-foreground">{t(course.summary, locale)}</span>
                    <span className="mt-4 font-semibold text-primary group-hover:underline">{d.cta.readMore} →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {testimonials.length > 0 && (
        <section aria-labelledby="testimonianze">
          <Container className="py-16">
            <SectionHeading id="testimonianze" title={d.home.testimonialsTitle} />
            <ul className="mt-8 grid gap-5 md:grid-cols-2">
              {testimonials.map((q) => (
                <li key={q.id} className="rounded-3xl border border-border bg-muted p-6">
                  <blockquote className="text-lg text-ink">“{t(q.quote, locale)}”</blockquote>
                  <p className="mt-3 font-semibold text-primary">{q.author}</p>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}
