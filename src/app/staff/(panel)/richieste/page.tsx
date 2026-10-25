import { DangerButton, Empty, Panel, StaffPage, SubmitButton } from "@/components/staff";
import { Badge } from "@/components/ui";
import { formatDateTime } from "@/lib/reminders";
import { requireStaff } from "@/server/auth";
import { getStore } from "@/server/store";
import { deleteMessage, toggleMessageRead } from "../../actions";

const TOPICS: Record<string, string> = {
  courses: "Corsi",
  payments: "Corsi e pagamenti",
  placement: "Test d'ingresso",
  trip: "Viaggio studio",
  other: "Altro",
};
const AGES: Record<string, string> = { young: "Young learners", middle: "Scuola media", high: "Scuola superiore", adults: "Adulti", unsure: "Non sa" };

export default async function RequestsPage() {
  const session = await requireStaff();
  const store = getStore();
  const [messages, certs] = await Promise.all([store.list("messages"), store.list("certifications", (c) => c.messageId !== null)]);
  messages.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <StaffPage title="Richieste dal sito" intro="Contatti, richieste di test d'ingresso e informazioni sui viaggi studio. Rispondi via email o telefono.">
      {messages.length === 0 && (
        <Panel>
          <Empty>Nessuna richiesta.</Empty>
        </Panel>
      )}
      {messages.map((m) => {
        const attached = certs.filter((c) => c.messageId === m.id);
        return (
          <Panel key={m.id} className={m.read ? "opacity-80" : "ring-2 ring-primary/30"}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-extrabold">
                  {m.name} {!m.read && <Badge tone="magenta">nuova</Badge>} <Badge>{TOPICS[m.topic] ?? m.topic}</Badge> {m.minor && <Badge tone="warn">riguarda un minorenne</Badge>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(m.createdAt)} · {m.locale.toUpperCase()}
                  {m.ageBand && ` · ${AGES[m.ageBand] ?? m.ageBand}`}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={toggleMessageRead}>
                  <input type="hidden" name="id" value={m.id} />
                  <SubmitButton variant="outline" small>
                    {m.read ? "Segna come da leggere" : "Segna come letta"}
                  </SubmitButton>
                </form>
                {session.role === "admin" && (
                  <form action={deleteMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <DangerButton>Elimina</DangerButton>
                  </form>
                )}
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap">{m.message}</p>
            <p className="mt-3 text-sm">
              <a href={`mailto:${m.email}`} className="font-semibold text-primary underline">
                {m.email}
              </a>
              {m.phone && (
                <>
                  {" · "}
                  <a href={`tel:${m.phone.replace(/[^\d+]/g, "")}`} className="font-semibold text-primary underline">
                    {m.phone}
                  </a>
                </>
              )}
            </p>
            {attached.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-xl bg-muted p-3 text-sm">
                {attached.map((c) => (
                  <li key={c.id}>
                    Certificazione allegata:{" "}
                    <a href={`/api/files/${c.fileId}`} target="_blank" className="font-semibold text-primary underline">
                      {c.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        );
      })}
    </StaffPage>
  );
}
