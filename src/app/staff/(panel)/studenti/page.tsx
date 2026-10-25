import Link from "next/link";
import { Field, Panel, StaffPage, SubmitButton, Empty } from "@/components/staff";
import { StaffFlash } from "@/components/staff-flash";
import { Badge } from "@/components/ui";
import { AGE_LABELS } from "@/lib/content/labels";
import { LEVELS } from "@/lib/content/schema";
import { requireStaff } from "@/server/auth";
import { readFlash } from "@/server/flash";
import { getStore } from "@/server/store";
import { createStudent } from "../../actions";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; errore?: string; tutti?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const store = getStore();
  const [students, accounts] = await Promise.all([store.list("students"), store.list("accounts")]);
  const shown = students
    .filter((s) => (sp.tutti ? true : s.active))
    .filter((s) => !q || s.displayName.toLowerCase().includes(q))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "it"));

  return (
    <StaffPage title="Studenti" intro="Ogni studente vede solo i propri dati; i genitori o tutori solo quelli degli studenti collegati.">
      <StaffFlash message={await readFlash()} />
      <Panel>
        <form className="flex flex-wrap items-end gap-3">
          <Field label="Cerca per nome" htmlFor="q" className="min-w-[14rem] flex-1">
            <input id="q" name="q" defaultValue={sp.q} className="field" />
          </Field>
          <label className="flex items-center gap-2 pb-3 text-sm font-semibold">
            <input type="checkbox" name="tutti" defaultChecked={Boolean(sp.tutti)} className="h-4 w-4 accent-primary" /> Mostra anche i non attivi
          </label>
          <SubmitButton variant="outline">Cerca</SubmitButton>
        </form>
        <div className="mt-5 overflow-x-auto">
          {shown.length === 0 ? (
            <Empty>Nessuno studente.</Empty>
          ) : (
            <table className="w-full text-left">
              <thead className="text-sm text-muted-foreground">
                <tr>
                  <th scope="col" className="pb-2 pr-3">Nome</th>
                  <th scope="col" className="pb-2 pr-3">Percorso</th>
                  <th scope="col" className="pb-2 pr-3">Livello</th>
                  <th scope="col" className="pb-2">Accessi</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((s) => {
                  const own = accounts.filter((a) => a.studentId === s.id).length;
                  const guardians = accounts.filter((a) => a.guardianOf.includes(s.id)).length;
                  return (
                    <tr key={s.id} className="border-t border-border">
                      <td className="py-2.5 pr-3">
                        <Link href={`/staff/studenti/${s.id}`} className="font-semibold text-primary underline">
                          {s.displayName}
                        </Link>{" "}
                        {s.demo && <Badge tone="magenta">demo</Badge>} {!s.active && <Badge tone="gray">non attivo</Badge>} {s.minor && <Badge>minorenne</Badge>}
                      </td>
                      <td className="py-2.5 pr-3">{AGE_LABELS[s.ageBand]}</td>
                      <td className="py-2.5 pr-3">{s.level || "—"}</td>
                      <td className="py-2.5 text-sm">
                        {own ? "studente" : ""}
                        {own && guardians ? " + " : ""}
                        {guardians ? `${guardians} genitore/i` : ""}
                        {!own && !guardians && <span className="text-muted-foreground">nessuno</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Panel>

      <Panel title="Nuovo studente">
        {sp.errore && <p className="mb-3 rounded-xl bg-danger-soft p-3 font-semibold text-danger">Inserisci nome e percorso.</p>}
        <p className="mb-4 text-sm text-muted-foreground">Basta nome e iniziale del cognome: non inserire dati che non servono.</p>
        <form action={createStudent} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome visualizzato (es. Giulia R.)" htmlFor="displayName">
            <input id="displayName" name="displayName" required maxLength={80} className="field" />
          </Field>
          <Field label="Percorso" htmlFor="ageBand">
            <select id="ageBand" name="ageBand" className="field" defaultValue="middle">
              {Object.entries(AGE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Livello" htmlFor="level">
            <select id="level" name="level" className="field" defaultValue="">
              <option value="">Da definire</option>
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 self-end pb-3 font-semibold">
            <input type="checkbox" name="minor" className="h-4 w-4 accent-primary" /> Minorenne (automatico per i percorsi sotto i 18 anni)
          </label>
          <Field label="Note interne (visibili solo al personale)" htmlFor="staffNotes" className="sm:col-span-2">
            <textarea id="staffNotes" name="staffNotes" rows={2} className="field" />
          </Field>
          <div>
            <SubmitButton>Crea studente</SubmitButton>
          </div>
        </form>
      </Panel>
    </StaffPage>
  );
}
