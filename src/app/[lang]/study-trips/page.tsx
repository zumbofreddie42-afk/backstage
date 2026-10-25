import type { Metadata } from "next";
import { Container, LinkButton, Notice, PageHero, RichText, Txt } from "@/components/ui";
import { visibleTrips } from "@/lib/content/visibility";
import { t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { loadSite } from "@/server/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, d } = await loadSite((await params).lang);
  return pageMetadata(locale, "/study-trips", d.trips.title, d.home.tripsCardText);
}

export default async function TripsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { content, mode, locale, d } = await loadSite((await params).lang);
  const preview = mode === "preview";
  const trips = visibleTrips(content.trips.items, mode);
  const askHref = `/${locale}/contact?topic=trip`;

  return (
    <>
      <PageHero eyebrow={d.nav.trips} title={d.trips.title} intro={<Txt text={t(content.trips.intro, locale)} preview={preview} />}>
        <LinkButton href={askHref} variant="light" className="mt-8">
          {d.cta.askTrip}
        </LinkButton>
      </PageHero>

      <Container className="py-16">
        <RichText text={t(content.trips.trinityNote, locale)} preview={preview} className="max-w-3xl text-lg" />

        {trips.length === 0 ? (
          <Notice className="mt-8">{d.trips.noTrips}</Notice>
        ) : (
          <div className="mt-10 space-y-8">
            {trips.map((trip) => (
              <article key={trip.id} className="overflow-hidden rounded-[2rem] border-2 border-border">
                <header className="bg-gradient-to-r from-primary to-magenta-strong px-6 py-5 text-white sm:px-8">
                  <h2 className="text-2xl font-extrabold">
                    <Txt text={t(trip.title, locale)} preview={preview} />
                  </h2>
                </header>
                <dl className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
                  {[
                    { label: d.trips.destination, value: t(trip.destination, locale) },
                    { label: d.trips.dates, value: t(trip.dates, locale) },
                    { label: d.trips.activities, value: t(trip.activities, locale) },
                    { label: d.trips.participation, value: t(trip.participation, locale) },
                  ].map((row) => (
                    <div key={row.label}>
                      <dt className="text-sm font-bold uppercase tracking-wide text-magenta-strong">{row.label}</dt>
                      <dd className="mt-1 text-lg">
                        <RichText text={row.value} preview={preview} />
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="px-6 pb-6 sm:px-8 sm:pb-8">
                  <LinkButton href={askHref}>{d.cta.askTrip}</LinkButton>
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
