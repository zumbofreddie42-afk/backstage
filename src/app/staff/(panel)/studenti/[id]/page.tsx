import { notFound } from "next/navigation";
import { BackLink, DangerButton, Empty, Field, Panel, StaffPage, SubmitButton } from "@/components/staff";
import { StaffFlash } from "@/components/staff-flash";
import { Badge } from "@/components/ui";
import { AGE_LABELS } from "@/lib/content/labels";
import { LEVELS } from "@/lib/content/schema";
import { formatDateTime, formatDay } from "@/lib/reminders";
import { todayInRome } from "@/lib/time";
import { dashboardData, totalMinutes } from "@/server/access";
import { requireStaff } from "@/server/auth";
import { readFlash } from "@/server/flash";
import { getStore } from "@/server/store";
import {
  addAppointment,
  addAssignment,
  addLesson,
  addPayment,
  addProgress,
  addReminder,
  cancelReminder,
  createStudentAccount,
  deleteCertification,
  deletePayment,
  deleteRecord,
  linkGuardian,
  replyShare,
  resetPassword,
  setCertificationStatus,
  setPaymentStatus,
  toggleAccount,
  unlinkGuardian,
  updateStudent,
} from "../../../actions";

const ERRORS: Record<string, string> = {
  "1": "Controlla i dati inseriti.",
  email: "Email non valida.",
  usata: "Questa email è già usata da un altro account.",
  lezione: "Data o durata della lezione non valide.",
  data: "Data non valida.",
  appuntamento: "Data/ora o durata non valide.",
  compito: "Serve almeno il titolo del compito.",
  pagamento: "Servono descrizione e scadenza.",
  promemoria: "Scrivi il messaggio del promemoria.",
  permessi: "I promemoria di pagamento sono riservati all'amministrazione.",
};

function Hidden({ studentId, back }: { studentId: string; back?: string }) {
  return (
    <>
      <input type="hidden" name="studentId" value={studentId} />
      {back && <input type="hidden" name="back" value={back} />}
    </>
  );
}

function Delete({ kind, id, back }: { kind: string; id: string; back: string }) {
  return (
    <form action={deleteRecord}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="back" value={back} />
      <DangerButton>Elimina</DangerButton>
    </form>
  );
}

export default async function StudentDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ errore?: string }> }) {
  const session = await requireStaff();
  const admin = session.role === "admin";
  const { id } = await params;
  const { errore } = await searchParams;
  const store = getStore();
  const student = await store.get("students", id);
  if (!student) notFound();
  const [data, accounts, allReminders] = await Promise.all([
    dashboardData(id),
    store.list("accounts", (a) => a.studentId === id || a.guardianOf.includes(id)),
    store.list("reminders", (r) => r.studentId === id),
  ]);
  const back = `/staff/studenti/${id}`;
  const today = todayInRome();
  const hours = (totalMinutes(data.lessons) / 60).toLocaleString("it-IT", { maximumFractionDigits: 1 });
  const own = accounts.filter((a) => a.studentId === id);
  const guardians = accounts.filter((a) => a.guardianOf.includes(id));

  return (
    <StaffPage
      title={student.displayName}
      intro={
        <span className="flex flex-wrap items-center gap-2">
          {AGE_LABELS[student.ageBand]} · livello {student.level || "da definire"} · {hours} h di lezione
          {student.demo && <Badge tone="magenta">demo</Badge>}
          {student.minor && <Badge>minorenne</Badge>}
        </span>
      }
      actions={<BackLink href="/staff/studenti">Tutti gli studenti</BackLink>}
    >
      <StaffFlash message={await readFlash()} />
      {errore && <p role="alert" className="rounded-xl bg-danger-soft p-3 font-semibold text-danger">{ERRORS[errore] ?? ERRORS["1"]}</p>}

      <nav aria-label="Sezioni" className="flex flex-wrap gap-2 text-sm font-semibold">
        {["profilo", "accessi", "lezioni", "progressi", "appuntamenti", "compiti", ...(admin ? ["pagamenti"] : []), "promemoria", "certificazioni", "conversazioni"].map((s) => (
          <a key={s} href={`#${s}`} className="rounded-full bg-white px-3 py-1.5 capitalize text-primary hover:bg-lavender">
            {s}
          </a>
        ))}
      </nav>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Profilo" id="profilo">
          <form action={updateStudent} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={id} />
            <Field label="Nome visualizzato" htmlFor="displayName">
              <input id="displayName" name="displayName" defaultValue={student.displayName} maxLength={80} className="field" />
            </Field>
            <Field label="Percorso" htmlFor="ageBand">
              <select id="ageBand" name="ageBand" defaultValue={student.ageBand} className="field">
                {Object.entries(AGE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Livello attuale" htmlFor="level">
              <select id="level" name="level" defaultValue={student.level} className="field">
                <option value="">Da definire</option>
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
            <div className="flex flex-col justify-end gap-2 pb-1 font-semibold">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="minor" defaultChecked={student.minor} className="h-4 w-4 accent-primary" /> Minorenne
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="active" defaultChecked={student.active} className="h-4 w-4 accent-primary" /> Attivo
              </label>
            </div>
            <Field label="Note interne (solo personale)" htmlFor="staffNotes" className="sm:col-span-2">
              <textarea id="staffNotes" name="staffNotes" rows={3} defaultValue={student.staffNotes} className="field" />
            </Field>
            <div>
              <SubmitButton>Salva profilo</SubmitButton>
            </div>
          </form>
        </Panel>

        <Panel title="Accessi all'area riservata" id="accessi">
          <ul className="space-y-3">
            {[...own, ...guardians].map((a) => (
              <li key={a.id} className="rounded-xl bg-muted p-3">
                <p className="font-semibold">
                  {a.name} <span className="font-normal text-muted-foreground">· {a.email}</span>{" "}
                  <Badge tone={a.role === "student" ? "violet" : "magenta"}>{a.role === "student" ? "studente" : "genitore/tutore"}</Badge>{" "}
                  {!a.active && <Badge tone="gray">disattivato</Badge>}
                  {a.mustChangePassword && <Badge tone="warn">password temporanea</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">Ultimo accesso: {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "mai"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <form action={resetPassword}>
                    <input type="hidden" name="accountId" value={a.id} />
                    <input type="hidden" name="back" value={back} />
                    <SubmitButton variant="outline" small>
                      Nuova password temporanea
                    </SubmitButton>
                  </form>
                  <form action={toggleAccount}>
                    <input type="hidden" name="accountId" value={a.id} />
                    <input type="hidden" name="back" value={back} />
                    <SubmitButton variant="soft" small>
                      {a.active ? "Disattiva" : "Riattiva"}
                    </SubmitButton>
                  </form>
                  {a.role === "guardian" && (
                    <form action={unlinkGuardian}>
                      <input type="hidden" name="accountId" value={a.id} />
                      <Hidden studentId={id} />
                      <DangerButton>Scollega</DangerButton>
                    </form>
                  )}
                </div>
              </li>
            ))}
            {own.length + guardians.length === 0 && <Empty>Nessun accesso creato.</Empty>}
          </ul>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {own.length === 0 && (
              <form action={createStudentAccount} className="space-y-3 rounded-xl border border-border p-4">
                <p className="font-semibold">Accesso per lo studente</p>
                <Hidden studentId={id} />
                <Field label="Email" htmlFor="s-email">
                  <input id="s-email" name="email" type="email" required className="field" />
                </Field>
                <Field label="Nome mostrato" htmlFor="s-name">
                  <input id="s-name" name="name" defaultValue={student.displayName} className="field" />
                </Field>
                <SubmitButton small>Crea accesso</SubmitButton>
              </form>
            )}
            <form action={linkGuardian} className="space-y-3 rounded-xl border border-border p-4">
              <p className="font-semibold">Genitore o tutore</p>
              <Hidden studentId={id} />
              <Field label="Email" htmlFor="g-email" hint="Se l'account esiste già viene solo collegato.">
                <input id="g-email" name="email" type="email" required className="field" />
              </Field>
              <Field label="Nome mostrato" htmlFor="g-name">
                <input id="g-name" name="name" placeholder="es. Mamma di Giulia" className="field" />
              </Field>
              <SubmitButton small>Collega</SubmitButton>
            </form>
          </div>
        </Panel>

        <Panel title={`Lezioni svolte · ${hours} h`} id="lezioni">
          <form action={addLesson} className="grid gap-3 sm:grid-cols-4">
            <Hidden studentId={id} />
            <Field label="Data" htmlFor="l-date">
              <input id="l-date" name="date" type="date" defaultValue={today} required className="field" />
            </Field>
            <Field label="Minuti" htmlFor="l-min">
              <input id="l-min" name="minutes" type="number" min={5} max={600} step={5} defaultValue={60} required className="field" />
            </Field>
            <Field label="Argomento" htmlFor="l-topic" className="sm:col-span-2">
              <input id="l-topic" name="topic" maxLength={200} className="field" />
            </Field>
            <Field label="Insegnante" htmlFor="l-teacher">
              <input id="l-teacher" name="teacher" maxLength={80} className="field" />
            </Field>
            <Field label="Nota visibile allo studente" htmlFor="l-note" className="sm:col-span-2">
              <input id="l-note" name="note" maxLength={500} className="field" />
            </Field>
            <div className="self-end">
              <SubmitButton small>Registra</SubmitButton>
            </div>
          </form>
          <ul className="mt-4 divide-y divide-border">
            {data.lessons.map((l) => (
              <li key={l.id} className="flex items-start justify-between gap-3 py-2">
                <span>
                  <b>{formatDay(l.date)}</b> · {l.minutes} min · {l.topic || "—"}
                  {l.teacher && <span className="text-muted-foreground"> · {l.teacher}</span>}
                </span>
                <Delete kind="lessons" id={l.id} back={`${back}#lezioni`} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Progressi" id="progressi">
          <form action={addProgress} className="grid gap-3 sm:grid-cols-3">
            <Hidden studentId={id} />
            <Field label="Data" htmlFor="p-date">
              <input id="p-date" name="date" type="date" defaultValue={today} required className="field" />
            </Field>
            <Field label="Livello" htmlFor="p-level">
              <select id="p-level" name="level" defaultValue={student.level} className="field">
                <option value="">—</option>
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Abilità (es. Speaking)" htmlFor="p-skill">
              <input id="p-skill" name="skill" maxLength={80} className="field" />
            </Field>
            <Field label="Commento visibile allo studente" htmlFor="p-comment" className="sm:col-span-3">
              <textarea id="p-comment" name="comment" rows={2} maxLength={1000} className="field" />
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
              <input type="checkbox" name="updateLevel" defaultChecked className="h-4 w-4 accent-primary" /> Aggiorna anche il livello attuale
            </label>
            <div>
              <SubmitButton small>Registra</SubmitButton>
            </div>
          </form>
          <ul className="mt-4 divide-y divide-border">
            {data.progress.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-3 py-2">
                <span>
                  <b>{formatDay(p.date)}</b> · {p.level || "—"} {p.skill && `· ${p.skill}`}
                  {p.comment && <span className="block text-sm text-muted-foreground">{p.comment}</span>}
                </span>
                <Delete kind="progress" id={p.id} back={`${back}#progressi`} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Appuntamenti e prossime lezioni" id="appuntamenti">
          <form action={addAppointment} className="grid gap-3 sm:grid-cols-3">
            <Hidden studentId={id} />
            <Field label="Data e ora (ora italiana)" htmlFor="a-start">
              <input id="a-start" name="startsAt" type="datetime-local" required className="field" />
            </Field>
            <Field label="Minuti" htmlFor="a-min">
              <input id="a-min" name="minutes" type="number" min={5} max={600} step={5} defaultValue={60} required className="field" />
            </Field>
            <Field label="Titolo" htmlFor="a-title">
              <input id="a-title" name="title" defaultValue="Lezione" maxLength={120} className="field" />
            </Field>
            <Field label="Link alla lezione online (https://…, facoltativo)" htmlFor="a-link" className="sm:col-span-2">
              <input id="a-link" name="link" type="url" className="field" />
            </Field>
            <Field label="Nota" htmlFor="a-note">
              <input id="a-note" name="note" maxLength={500} className="field" />
            </Field>
            <div>
              <SubmitButton small>Aggiungi</SubmitButton>
            </div>
          </form>
          <ul className="mt-4 divide-y divide-border">
            {data.appointments.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-2">
                <span className={new Date(a.startsAt) < new Date() ? "text-muted-foreground" : undefined}>
                  <b>{formatDateTime(a.startsAt)}</b> · {a.title} · {a.minutes} min
                </span>
                <Delete kind="appointments" id={a.id} back={`${back}#appuntamenti`} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Compiti e risorse assegnati" id="compiti">
          <form action={addAssignment} className="grid gap-3 sm:grid-cols-2">
            <Hidden studentId={id} />
            <Field label="Titolo" htmlFor="h-title">
              <input id="h-title" name="title" required maxLength={200} className="field" />
            </Field>
            <Field label="Scadenza (facoltativa)" htmlFor="h-due">
              <input id="h-due" name="dueDate" type="date" className="field" />
            </Field>
            <Field label="Descrizione" htmlFor="h-desc" className="sm:col-span-2">
              <textarea id="h-desc" name="description" rows={2} maxLength={3000} className="field" />
            </Field>
            <Field label="Link a una risorsa (facoltativo)" htmlFor="h-url">
              <input id="h-url" name="url" type="url" className="field" />
            </Field>
            <div className="self-end">
              <SubmitButton small>Assegna</SubmitButton>
            </div>
          </form>
          <ul className="mt-4 divide-y divide-border">
            {data.assignments.map((x) => (
              <li key={x.id} className="flex items-start justify-between gap-3 py-2">
                <span>
                  <b>{x.title}</b> {x.dueDate && `· entro ${formatDay(x.dueDate)}`} {x.doneAt ? <Badge tone="ok">fatto</Badge> : <Badge tone="gray">da fare</Badge>}
                </span>
                <Delete kind="assignments" id={x.id} back={`${back}#compiti`} />
              </li>
            ))}
          </ul>
        </Panel>

        {admin && (
          <Panel title="Piano di pagamento" id="pagamenti">
            <p className="mb-3 text-sm text-muted-foreground">
              Visibile solo allo studente e ai genitori collegati. Lo stato lo cambi tu: il sito non incassa e non segna pagamenti da solo.
            </p>
            <form action={addPayment} className="grid gap-3 sm:grid-cols-4">
              <Hidden studentId={id} />
              <Field label="Descrizione" htmlFor="y-label" className="sm:col-span-2">
                <input id="y-label" name="label" required placeholder="es. Rata di novembre" maxLength={120} className="field" />
              </Field>
              <Field label="Scadenza" htmlFor="y-due">
                <input id="y-due" name="dueDate" type="date" required className="field" />
              </Field>
              <Field label="Importo (facoltativo)" htmlFor="y-amount">
                <input id="y-amount" name="amount" placeholder="es. 80 €" maxLength={40} className="field" />
              </Field>
              <Field label="Nota" htmlFor="y-note" className="sm:col-span-3">
                <input id="y-note" name="note" maxLength={500} className="field" />
              </Field>
              <div className="self-end">
                <SubmitButton small>Aggiungi scadenza</SubmitButton>
              </div>
            </form>
            <ul className="mt-4 divide-y divide-border">
              {data.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                  <span>
                    <b>{p.label}</b> · {formatDay(p.dueDate)} {p.amount && `· ${p.amount}`}{" "}
                    <Badge tone={p.status === "paid" ? "ok" : p.status === "cancelled" ? "gray" : p.dueDate < today ? "danger" : "warn"}>
                      {p.status === "paid" ? "saldato" : p.status === "cancelled" ? "annullato" : p.dueDate < today ? "scaduto" : "da saldare"}
                    </Badge>
                    {p.statusUpdatedAt && <span className="block text-xs text-muted-foreground">Stato aggiornato il {formatDay(p.statusUpdatedAt)}</span>}
                  </span>
                  <span className="flex flex-wrap gap-2">
                    <form action={setPaymentStatus} className="flex gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <label className="sr-only" htmlFor={`st-${p.id}`}>
                        Stato
                      </label>
                      <select id={`st-${p.id}`} name="status" defaultValue={p.status} className="field py-1.5 text-sm">
                        <option value="pending">Da saldare</option>
                        <option value="paid">Saldato</option>
                        <option value="cancelled">Annullato</option>
                      </select>
                      <SubmitButton variant="outline" small>
                        Aggiorna
                      </SubmitButton>
                    </form>
                    <form action={deletePayment}>
                      <input type="hidden" name="id" value={p.id} />
                      <DangerButton>Elimina</DangerButton>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <Panel title="Promemoria" id="promemoria">
          <p className="mb-3 text-sm text-muted-foreground">
            I promemoria compaiono nell&apos;area riservata e, se attivo, arrivano anche via email. Quelli automatici si configurano in «Promemoria».
          </p>
          <form action={addReminder} className="grid gap-3 sm:grid-cols-3">
            <Hidden studentId={id} />
            <Field label="Tipo" htmlFor="r-kind">
              <select id="r-kind" name="kind" className="field">
                <option value="lesson">Lezione</option>
                {admin && <option value="payment">Pagamento</option>}
                <option value="other">Avviso</option>
              </select>
            </Field>
            <Field label="Invio (vuoto = subito)" htmlFor="r-at">
              <input id="r-at" name="sendAt" type="datetime-local" className="field" />
            </Field>
            <Field label="Messaggio" htmlFor="r-msg" className="sm:col-span-3">
              <input id="r-msg" name="message" required maxLength={500} className="field" />
            </Field>
            <div className="flex flex-wrap gap-4 text-sm font-semibold sm:col-span-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="toStudent" defaultChecked className="h-4 w-4 accent-primary" /> Studente
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="toGuardians" defaultChecked className="h-4 w-4 accent-primary" /> Genitori/tutori
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="byEmail" className="h-4 w-4 accent-primary" /> Anche via email
              </label>
            </div>
            <div>
              <SubmitButton small>Programma</SubmitButton>
            </div>
          </form>
          <ul className="mt-4 divide-y divide-border">
            {allReminders
              .sort((a, b) => b.sendAt.localeCompare(a.sendAt))
              .map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-2">
                  <span>
                    <Badge tone={r.status === "sent" ? "ok" : r.status === "cancelled" ? "gray" : "warn"}>
                      {r.status === "sent" ? "inviato" : r.status === "cancelled" ? "annullato" : "programmato"}
                    </Badge>{" "}
                    {formatDateTime(r.sendAt)} · {r.message}
                    {r.sourceId && <span className="text-xs text-muted-foreground"> (automatico)</span>}
                    {r.deliveryLog && <span className="block text-xs text-muted-foreground">{r.deliveryLog}</span>}
                  </span>
                  {r.status === "scheduled" && (
                    <form action={cancelReminder}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="back" value={`${back}#promemoria`} />
                      <DangerButton>Annulla</DangerButton>
                    </form>
                  )}
                </li>
              ))}
          </ul>
        </Panel>

        <Panel title="Certificazioni" id="certificazioni">
          {data.certifications.length === 0 ? (
            <Empty>Nessuna certificazione caricata.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {data.certifications.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                  <span>
                    <a href={`/api/files/${c.fileId}`} target="_blank" className="font-semibold text-primary underline">
                      {c.title}
                    </a>{" "}
                    · {formatDay(c.uploadedAt)} · caricata da {c.uploadedBy === "guardian" ? "genitore" : c.uploadedBy === "student" ? "studente" : "personale"}{" "}
                    <Badge tone={c.status === "checked" ? "ok" : "gray"}>{c.status === "checked" ? "verificata" : "ricevuta"}</Badge>
                  </span>
                  <span className="flex gap-2">
                    <form action={setCertificationStatus}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="back" value={`${back}#certificazioni`} />
                      <SubmitButton variant="outline" small>
                        {c.status === "checked" ? "Segna come da verificare" : "Segna come verificata"}
                      </SubmitButton>
                    </form>
                    <form action={deleteCertification}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="back" value={`${back}#certificazioni`} />
                      <DangerButton>Elimina</DangerButton>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Conversazioni con l'AI condivise" id="conversazioni" className="xl:col-span-2">
          {data.shares.length === 0 ? (
            <Empty>Nessuna conversazione condivisa.</Empty>
          ) : (
            <ul className="space-y-5">
              {data.shares.map((s) => (
                <li key={s.id} className="rounded-xl border border-border p-4">
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(s.createdAt)} · {AGE_LABELS[s.ageBand]} · livello {s.level === "unknown" ? "non indicato" : s.level}
                  </p>
                  {s.note && <p className="mt-1 font-semibold">Nota dello studente: {s.note}</p>}
                  <details className="mt-2">
                    <summary className="cursor-pointer font-semibold text-primary">Leggi la conversazione ({s.transcript.length} messaggi)</summary>
                    <ol className="mt-2 space-y-2">
                      {s.transcript.map((t, i) => (
                        <li key={i} className={t.role === "user" ? "rounded-lg bg-lavender p-2" : "rounded-lg bg-muted p-2"}>
                          <b>{t.role === "user" ? "Studente" : "Tutor AI"}:</b> <span className="whitespace-pre-wrap">{t.text}</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                  <form action={replyShare} className="mt-3 space-y-2">
                    <input type="hidden" name="id" value={s.id} />
                    <Field label="Risposta dell'insegnante (visibile nell'area dello studente)" htmlFor={`rep-${s.id}`}>
                      <textarea id={`rep-${s.id}`} name="reply" rows={2} defaultValue={s.teacherReply} maxLength={3000} className="field" />
                    </Field>
                    <SubmitButton small>Salva risposta</SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </StaffPage>
  );
}
