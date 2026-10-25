import Link from "next/link";
import { Panel, StaffPage, Empty } from "@/components/staff";
import { Badge } from "@/components/ui";
import { formatDateTime, formatDay } from "@/lib/reminders";
import { nowMs } from "@/lib/time";
import { requireStaff } from "@/server/auth";
import { getSiteMode, isDatabaseConfigured, isEmailConfigured, isTutorLive } from "@/server/config";
import { runReminders } from "@/server/reminders";
import { getStore } from "@/server/store";

export default async function StaffHome({ searchParams }: { searchParams: Promise<{ negato?: string }> }) {
  const session = await requireStaff();
  const { negato } = await searchParams;
  await runReminders().catch((err) => console.error("[reminders]", err));
  const store = getStore();
  const now = nowMs();
  const [students, messages, appointments, shares, payments] = await Promise.all([
    store.list("students", (s) => s.active),
    store.list("messages", (m) => !m.read),
    store.list("appointments", (a) => new Date(a.startsAt).getTime() > now && new Date(a.startsAt).getTime() < now + 7 * 86_400_000),
    store.list("shares", (s) => !s.teacherReply),
    session.role === "admin" ? store.list("payments", (p) => p.status === "pending") : Promise.resolve([]),
  ]);
  const name = new Map(students.map((s) => [s.id, s.displayName]));
  const today = new Date().toISOString().slice(0, 10);
  const overdue = payments.filter((p) => p.dueDate < today);

  return (
    <StaffPage title="Riepilogo" intro="Quello che richiede attenzione oggi.">
      {negato && <p className="rounded-xl bg-warn-soft p-3 font-semibold text-warn">Questa funzione è riservata all&apos;amministrazione.</p>}
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Studenti attivi", value: students.length, href: "/staff/studenti" },
          { label: "Richieste da leggere", value: messages.length, href: "/staff/richieste" },
          { label: "Lezioni nei prossimi 7 giorni", value: appointments.length, href: "/staff/studenti" },
          { label: "Conversazioni AI da guardare", value: shares.length, href: "#condivise" },
        ].map((x) => (
          <Link key={x.label} href={x.href} className="rounded-2xl bg-white p-5 hover:ring-2 hover:ring-primary">
            <dt className="text-sm font-semibold text-muted-foreground">{x.label}</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold text-primary">{x.value}</dd>
          </Link>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Prossime lezioni (7 giorni)">
          {appointments.length === 0 ? (
            <Empty>Nessuna lezione in programma.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {appointments
                .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
                .map((a) => (
                  <li key={a.id} className="py-2">
                    <Link href={`/staff/studenti/${a.studentId}`} className="font-semibold text-primary underline">
                      {name.get(a.studentId) ?? "Studente"}
                    </Link>{" "}
                    · {a.title} · {formatDateTime(a.startsAt)}
                  </li>
                ))}
            </ul>
          )}
        </Panel>

        {session.role === "admin" && (
          <Panel title="Scadenze di pagamento aperte">
            {payments.length === 0 ? (
              <Empty>Nessuna scadenza aperta.</Empty>
            ) : (
              <ul className="divide-y divide-border">
                {payments
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                  .slice(0, 12)
                  .map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                      <span>
                        <Link href={`/staff/studenti/${p.studentId}#pagamenti`} className="font-semibold text-primary underline">
                          {name.get(p.studentId) ?? "Studente"}
                        </Link>{" "}
                        · {p.label} · {formatDay(p.dueDate)}
                      </span>
                      {p.dueDate < today ? <Badge tone="danger">Scaduta</Badge> : <Badge tone="warn">Da saldare</Badge>}
                    </li>
                  ))}
              </ul>
            )}
            {overdue.length > 0 && <p className="mt-3 text-sm text-danger">{overdue.length} scadenze superate: verifica e aggiorna lo stato.</p>}
          </Panel>
        )}

        <Panel title="Conversazioni con l'AI condivise dagli studenti" id="condivise">
          {shares.length === 0 ? (
            <Empty>Nessuna conversazione in attesa.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {shares.map((s) => (
                <li key={s.id} className="py-2">
                  <Link href={`/staff/studenti/${s.studentId}#conversazioni`} className="font-semibold text-primary underline">
                    {name.get(s.studentId) ?? "Studente"}
                  </Link>{" "}
                  · {formatDay(s.createdAt)} · “{s.transcript.find((t) => t.role === "user")?.text.slice(0, 80)}”
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Stato dei servizi">
          <ul className="space-y-2">
            <li>
              Modalità del sito: {getSiteMode() === "live" ? <Badge tone="ok">Pubblicato</Badge> : <Badge tone="warn">Anteprima</Badge>}
            </li>
            <li>
              AI English Tutor: {isTutorLive() ? <Badge tone="ok">AI attiva</Badge> : <Badge tone="warn">Dimostrativo (manca ANTHROPIC_API_KEY)</Badge>}
            </li>
            <li>
              Email (promemoria e avvisi): {isEmailConfigured() ? <Badge tone="ok">Attive</Badge> : <Badge tone="warn">Non configurate (RESEND_API_KEY)</Badge>}
            </li>
            <li>
              Archivio dati:{" "}
              {isDatabaseConfigured() ? (
                <Badge tone="ok">Database Supabase</Badge>
              ) : (
                <>
                  <Badge tone="warn">Locale</Badge> <span className="text-sm text-muted-foreground">— su Vercel serve Supabase (vedi README).</span>
                </>
              )}
            </li>
          </ul>
        </Panel>
      </div>
    </StaffPage>
  );
}
