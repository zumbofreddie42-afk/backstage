import Link from "next/link";
import { Empty, Field, Panel, StaffPage, SubmitButton, DangerButton } from "@/components/staff";
import { StaffFlash } from "@/components/staff-flash";
import { Badge } from "@/components/ui";
import { formatDateTime } from "@/lib/reminders";
import { requireStaff } from "@/server/auth";
import { isEmailConfigured } from "@/server/config";
import { readFlash } from "@/server/flash";
import { getStore } from "@/server/store";
import { cancelReminder, runRemindersNow, saveReminderSettings } from "../../actions";

export default async function RemindersPage() {
  const session = await requireStaff();
  const store = getStore();
  const [content, reminders, students] = await Promise.all([store.getContent(), store.list("reminders"), store.list("students")]);
  const s = content.reminders;
  const name = new Map(students.map((x) => [x.id, x.displayName]));
  const scheduled = reminders.filter((r) => r.status === "scheduled").sort((a, b) => a.sendAt.localeCompare(b.sendAt));
  const sent = reminders.filter((r) => r.status === "sent").sort((a, b) => b.sendAt.localeCompare(a.sendAt)).slice(0, 30);
  const visible = (kind: string) => session.role === "admin" || kind !== "payment";

  return (
    <StaffPage
      title="Promemoria"
      intro="Avvisi per lezioni e scadenze. Compaiono sempre nell'area riservata; via email solo se l'invio è attivo e configurato."
      actions={
        <form action={runRemindersNow}>
          <SubmitButton variant="outline">Aggiorna e invia ora</SubmitButton>
        </form>
      }
    >
      <StaffFlash message={await readFlash()} />

      {session.role === "admin" && (
        <Panel title="Impostazioni">
          <form action={saveReminderSettings} className="grid gap-4 md:grid-cols-2">
            <fieldset className="space-y-3 rounded-xl border border-border p-4">
              <legend className="px-1 font-semibold">Promemoria automatici</legend>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="autoPayment" defaultChecked={s.autoPayment} className="h-4 w-4 accent-primary" /> Prima delle scadenze di pagamento
              </label>
              <Field label="Giorni di anticipo" htmlFor="pd">
                <input id="pd" name="paymentDaysBefore" type="number" min={0} max={60} defaultValue={s.paymentDaysBefore} className="field max-w-[8rem]" />
              </Field>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="autoLesson" defaultChecked={s.autoLesson} className="h-4 w-4 accent-primary" /> Prima delle lezioni in calendario
              </label>
              <Field label="Ore di anticipo" htmlFor="lh">
                <input id="lh" name="lessonHoursBefore" type="number" min={0} max={168} defaultValue={s.lessonHoursBefore} className="field max-w-[8rem]" />
              </Field>
            </fieldset>
            <fieldset className="space-y-3 rounded-xl border border-border p-4">
              <legend className="px-1 font-semibold">Destinatari e canali</legend>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="notifyStudents" defaultChecked={s.notifyStudents} className="h-4 w-4 accent-primary" /> Studenti (con accesso)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="notifyGuardians" defaultChecked={s.notifyGuardians} className="h-4 w-4 accent-primary" /> Genitori e tutori collegati
              </label>
              <p className="text-sm">
                <Badge>Area riservata</Badge> sempre attiva
              </p>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="emailChannel" defaultChecked={s.emailChannel} className="h-4 w-4 accent-primary" /> Anche via email
              </label>
              {!isEmailConfigured() && <p className="text-sm text-warn">L&apos;invio email non è ancora configurato (RESEND_API_KEY ed EMAIL_FROM): per ora i promemoria restano nell&apos;area riservata.</p>}
              <p className="text-xs text-muted-foreground">WhatsApp e SMS non sono collegati: richiedono un servizio esterno dedicato.</p>
            </fieldset>
            <div>
              <SubmitButton>Salva impostazioni</SubmitButton>
            </div>
          </form>
        </Panel>
      )}

      <Panel title={`Programmati (${scheduled.filter((r) => visible(r.kind)).length})`}>
        {scheduled.length === 0 ? (
          <Empty>Nessun promemoria programmato.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {scheduled.filter((r) => visible(r.kind)).map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-2">
                <span>
                  <b>{formatDateTime(r.sendAt)}</b> ·{" "}
                  <Link href={`/staff/studenti/${r.studentId}#promemoria`} className="font-semibold text-primary underline">
                    {name.get(r.studentId) ?? "Studente"}
                  </Link>{" "}
                  · {r.message} {r.byEmail && <Badge>email</Badge>} {r.sourceId && <Badge tone="gray">automatico</Badge>}
                </span>
                <form action={cancelReminder}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="back" value="/staff/promemoria" />
                  <DangerButton>Annulla</DangerButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Inviati di recente">
        {sent.length === 0 ? (
          <Empty>Nessun promemoria inviato.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {sent.filter((r) => visible(r.kind)).map((r) => (
              <li key={r.id} className="py-2">
                <b>{formatDateTime(r.sentAt ?? r.sendAt)}</b> · {name.get(r.studentId) ?? "Studente"} · {r.message}
                {r.deliveryLog && <span className="block text-xs text-muted-foreground">{r.deliveryLog}</span>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </StaffPage>
  );
}
