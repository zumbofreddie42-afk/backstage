import Link from "next/link";
import { redirect } from "next/navigation";
import clsx from "clsx";
import { AreaBar } from "@/components/area-bar";
import { Badge, buttonClass, Card, Container, LinkButton, Notice } from "@/components/ui";
import { formatDateTime, formatDay } from "@/lib/reminders";
import { nowMs } from "@/lib/time";
import { t } from "@/lib/i18n";
import { dashboardData, pickStudent, totalMinutes } from "@/server/access";
import { requireAccount } from "@/server/auth";
import { runReminders } from "@/server/reminders";
import { loadSite } from "@/server/site";
import { toggleAssignment, uploadCertification } from "./actions";

function Section({ id, title, children, className }: { id?: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={clsx("scroll-mt-28", className)}>
      <h2 id={id} className="text-xl font-extrabold text-ink">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export default async function AreaPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ s?: string; cert?: string }> }) {
  const { content, locale, d } = await loadSite((await params).lang);
  const account = await requireAccount(locale);
  if (account.mustChangePassword) redirect(`/${locale}/area/password`);
  const sp = await searchParams;
  const a = d.area;
  const dateLocale = locale === "it" ? "it-IT" : "en-GB";

  await runReminders().catch((err) => console.error("[reminders]", err));
  const { student, all } = await pickStudent(account, sp.s);

  if (!student) {
    return (
      <>
        <AreaBar account={account} d={d} locale={locale} current="dashboard" />
        <Container className="py-14">
          <Notice>{a.notLinked}</Notice>
        </Container>
      </>
    );
  }

  const data = await dashboardData(student.id);
  const course = content.courses.find((c) => c.id === student.ageBand);
  const minutes = totalMinutes(data.lessons);
  const hours = (minutes / 60).toLocaleString(dateLocale, { maximumFractionDigits: 1 });
  const now = nowMs();
  const upcoming = data.appointments.filter((x) => new Date(x.startsAt).getTime() + x.minutes * 60_000 >= now);
  const q = `s=${student.id}`;

  return (
    <>
      <AreaBar account={account} d={d} locale={locale} current="dashboard" />
      <Container className="py-10">
        {all.length > 1 && (
          <nav aria-label={a.chooseStudent} className="mb-6 flex flex-wrap items-center gap-2">
            <span className="font-semibold">{a.chooseStudent}:</span>
            {all.map((s) => (
              <Link
                key={s.id}
                href={`/${locale}/area?s=${s.id}`}
                aria-current={s.id === student.id ? "true" : undefined}
                className="rounded-full border-2 border-border px-4 py-1.5 font-semibold hover:border-primary aria-[current=true]:border-primary aria-[current=true]:bg-primary aria-[current=true]:text-white"
              >
                {s.displayName}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{student.displayName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{a.privacyNote}</p>
          </div>
          <LinkButton href={`/${locale}/area/tutor?${q}`} variant="magenta">
            {a.openTutor}
          </LinkButton>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: a.course, value: course ? `${t(course.title, locale)} · ${t(course.ages, locale)}` : "—" },
            { label: a.level, value: student.level || "—" },
            { label: a.hours, value: `${hours} h` },
          ].map((x) => (
            <div key={x.label} className="rounded-3xl bg-gradient-to-br from-primary to-[#7b3fd6] p-5 text-white">
              <dt className="text-sm font-semibold text-ink-muted">{x.label}</dt>
              <dd className="mt-1 font-display text-2xl font-extrabold">{x.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Section title={a.upcoming}>
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground">{a.noUpcoming}</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((x) => (
                  <li key={x.id} className="rounded-2xl bg-muted p-4">
                    <p className="font-semibold text-ink">{x.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(x.startsAt, dateLocale)} · {x.minutes} {a.minutes}
                    </p>
                    {x.note && <p className="mt-1 text-sm">{x.note}</p>}
                    {/^https:\/\//.test(x.link) && (
                      <a href={x.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-primary underline">
                        {a.joinLesson} ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={a.reminders}>
            {data.reminders.length === 0 ? (
              <p className="text-muted-foreground">{a.noReminders}</p>
            ) : (
              <ul className="space-y-2">
                {data.reminders.slice(0, 8).map((r) => (
                  <li key={r.id} className="flex gap-3 rounded-2xl bg-muted p-3">
                    <span className="shrink-0 self-start">
                      <Badge tone={r.kind === "payment" ? "magenta" : "violet"}>{a.reminderKind[r.kind]}</Badge>
                    </span>
                    <span>
                      {r.message}
                      <span className="block text-xs text-muted-foreground">{formatDay(r.sentAt ?? r.sendAt, dateLocale)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section id="compiti" title={a.homework} className="lg:col-span-2">
            {data.assignments.length === 0 ? (
              <p className="text-muted-foreground">{a.noHomework}</p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {data.assignments.map((x) => (
                  <li key={x.id} className={clsx("flex flex-col rounded-2xl border-2 p-4", x.doneAt ? "border-ok/40 bg-ok-soft" : "border-border")}>
                    <p className="font-semibold text-ink">{x.title}</p>
                    {x.dueDate && (
                      <p className="text-sm text-muted-foreground">
                        {a.due}: {formatDay(x.dueDate, dateLocale)}
                      </p>
                    )}
                    {x.description && <p className="mt-1 flex-1 whitespace-pre-line">{x.description}</p>}
                    {/^https?:\/\//.test(x.url) && (
                      <a href={x.url} target="_blank" rel="noopener noreferrer" className="mt-2 font-semibold text-primary underline">
                        {d.resources.open} ↗
                      </a>
                    )}
                    <form action={toggleAssignment} className="mt-3">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="id" value={x.id} />
                      <button type="submit" className={buttonClass(x.doneAt ? "soft" : "outline", "min-h-9 px-4 py-1.5 text-sm")}>
                        {x.doneAt ? `✓ ${a.done}` : a.markDone}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={a.progress}>
            {data.progress.length === 0 ? (
              <p className="text-muted-foreground">{a.noProgress}</p>
            ) : (
              <ol className="relative space-y-4 border-l-4 border-lavender pl-5">
                {data.progress.map((p) => (
                  <li key={p.id}>
                    <span aria-hidden="true" className="absolute -left-[0.6rem] mt-1.5 h-4 w-4 rounded-full border-4 border-white bg-primary" />
                    <p className="text-sm text-muted-foreground">{formatDay(p.date, dateLocale)}</p>
                    <p className="font-semibold text-ink">
                      {p.level}
                      {p.skill && <span className="font-normal text-muted-foreground"> · {p.skill}</span>}
                    </p>
                    {p.comment && <p>{p.comment}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <Section title={a.lessons}>
            {data.lessons.length === 0 ? (
              <p className="text-muted-foreground">{a.noLessons}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[0.95rem]">
                  <thead className="text-sm text-muted-foreground">
                    <tr>
                      <th scope="col" className="pb-2 pr-3 font-semibold">{a.date}</th>
                      <th scope="col" className="pb-2 pr-3 font-semibold">{a.topic}</th>
                      <th scope="col" className="pb-2 text-right font-semibold">{a.duration}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lessons.map((l) => (
                      <tr key={l.id} className="border-t border-border align-top">
                        <td className="py-2 pr-3 whitespace-nowrap">{formatDay(l.date, dateLocale)}</td>
                        <td className="py-2 pr-3">
                          {l.topic}
                          {l.note && <span className="block text-sm text-muted-foreground">{l.note}</span>}
                        </td>
                        <td className="py-2 text-right whitespace-nowrap">
                          {l.minutes} {a.minutes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title={a.payments} className="lg:col-span-2">
            {data.payments.length === 0 ? (
              <p className="text-muted-foreground">{a.noPayments}</p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {data.payments.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-3 rounded-2xl bg-muted p-4">
                    <div>
                      <p className="font-semibold text-ink">{p.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.due}: {formatDay(p.dueDate, dateLocale)}
                        {p.amount && ` · ${p.amount}`}
                      </p>
                      {p.note && <p className="mt-1 text-sm">{p.note}</p>}
                    </div>
                    <Badge tone={p.status === "paid" ? "ok" : p.status === "cancelled" ? "gray" : "warn"}>{a.paymentStatus[p.status]}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-sm text-muted-foreground">{a.paymentNote}</p>
            <Link href={`/${locale}/contact?topic=payments`} className="mt-2 inline-block font-semibold text-primary underline">
              {d.cta.askPayments}
            </Link>
          </Section>

          <Section id="certificazioni" title={a.certifications}>
            {sp.cert === "ok" && <Notice tone="ok" className="mb-4">{a.certSaved}</Notice>}
            {sp.cert === "errore" && <Notice tone="error" className="mb-4">{d.form.errors.file}</Notice>}
            {data.certifications.length === 0 ? (
              <p className="text-muted-foreground">{a.noCerts}</p>
            ) : (
              <ul className="space-y-2">
                {data.certifications.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded-2xl bg-muted p-3">
                    <a href={`/api/files/${c.fileId}`} className="font-semibold text-primary underline">
                      {c.title}
                    </a>
                    <Badge tone={c.status === "checked" ? "ok" : "gray"}>{a.certStatus[c.status]}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <form action={uploadCertification} className="mt-5 space-y-3 rounded-2xl border border-border p-4">
              <p className="font-semibold">{a.certUpload}</p>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="studentId" value={student.id} />
              <div>
                <label htmlFor="cert-title" className="block text-sm font-semibold">
                  {a.certTitle}
                </label>
                <input id="cert-title" name="title" maxLength={200} className="field mt-1" />
              </div>
              <div>
                <label htmlFor="cert-file" className="block text-sm font-semibold">
                  {a.certFile}
                </label>
                <input id="cert-file" name="file" type="file" required accept="application/pdf,image/jpeg,image/png" className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-white" />
              </div>
              <button type="submit" className={buttonClass("primary")}>
                {a.certUpload}
              </button>
            </form>
          </Section>

          <Section title={a.tutorShares}>
            {data.shares.length === 0 ? (
              <p className="text-muted-foreground">{a.noShares}</p>
            ) : (
              <ul className="space-y-3">
                {data.shares.map((s) => (
                  <li key={s.id} className="rounded-2xl bg-muted p-4">
                    <p className="text-sm text-muted-foreground">{formatDay(s.createdAt, dateLocale)}</p>
                    <p className="font-semibold text-ink">“{s.transcript.find((x) => x.role === "user")?.text.slice(0, 120)}”</p>
                    {s.teacherReply ? (
                      <div className="mt-2 rounded-xl bg-white p-3">
                        <p className="text-sm font-bold text-primary">{a.teacherReply}</p>
                        <p className="whitespace-pre-line">{s.teacherReply}</p>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </Container>
    </>
  );
}
