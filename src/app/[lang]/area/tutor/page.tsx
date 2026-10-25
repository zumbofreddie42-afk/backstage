import { redirect } from "next/navigation";
import { AreaBar } from "@/components/area-bar";
import { TutorChat } from "@/components/tutor-chat";
import { Container } from "@/components/ui";
import { pickStudent } from "@/server/access";
import { requireAccount } from "@/server/auth";
import { isTutorLive } from "@/server/config";
import { loadSite } from "@/server/site";

export default async function AreaTutorPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ s?: string }> }) {
  const { locale, d } = await loadSite((await params).lang);
  const account = await requireAccount(locale);
  if (account.mustChangePassword) redirect(`/${locale}/area/password`);
  const { student } = await pickStudent(account, (await searchParams).s);
  const tt = d.tutor;

  return (
    <>
      <AreaBar account={account} d={d} locale={locale} current="tutor" />
      <Container className="max-w-4xl py-10">
        <h1 className="text-3xl font-extrabold text-ink">{tt.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{tt.intro}</p>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {tt.rulesItems.map((r) => (
            <li key={r} className="rounded-2xl bg-lavender px-4 py-2.5">
              {r}
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <TutorChat
            d={d}
            ageBands={d.ageBands}
            live={isTutorLive()}
            initialAgeBand={student?.ageBand}
            initialLevel={student?.level && student.level !== "pre-A1" ? student.level : undefined}
            initialExplainIn={locale === "it" ? "it" : "en"}
            shareStudentId={student?.id}
          />
        </div>
      </Container>
    </>
  );
}
