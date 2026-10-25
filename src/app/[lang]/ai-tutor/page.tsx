import type { Metadata } from "next";
import { TutorChat } from "@/components/tutor-chat";
import { Container, LinkButton, PageHero } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { getCurrentAccount } from "@/server/auth";
import { isTutorLive, tutorAccess } from "@/server/config";
import { loadSite } from "@/server/site";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, d } = await loadSite((await params).lang);
  return pageMetadata(locale, "/ai-tutor", d.tutor.title, d.tutor.intro);
}

export default async function TutorPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ q?: string }> }) {
  const { locale, d } = await loadSite((await params).lang);
  const { q } = await searchParams;
  const account = await getCurrentAccount();
  const live = isTutorLive() && (tutorAccess() === "public" || account !== null);
  const tt = d.tutor;

  return (
    <>
      <PageHero eyebrow={d.cta.homeworkHelp} title={tt.title} intro={tt.intro}>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="#chat" variant="light">
            {tt.open}
          </LinkButton>
          <LinkButton href={`/${locale}/area/tutor`} variant="ghostLight">
            {d.cta.studentArea}
          </LinkButton>
        </div>
      </PageHero>

      <Container className="grid gap-10 py-14 lg:grid-cols-[1fr_20rem]">
        <section id="chat" aria-label={tt.chatLabel} className="scroll-mt-24">
          <TutorChat
            d={d}
            ageBands={d.ageBands}
            live={live}
            initialExplainIn={locale === "it" ? "it" : "en"}
            initialQuestion={typeof q === "string" ? q.slice(0, 300) : undefined}
          />
          {!live && <p className="mt-3 text-sm text-muted-foreground">{tt.loginForLive}</p>}
        </section>
        <aside className="space-y-6">
          <div className="rounded-3xl bg-lavender p-6">
            <h2 className="text-xl font-extrabold text-ink">{tt.whatTitle}</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              {tt.whatItems.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border-2 border-magenta bg-magenta-soft p-6">
            <h2 className="text-xl font-extrabold text-ink">{tt.rulesTitle}</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              {tt.rulesItems.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </aside>
      </Container>
    </>
  );
}
