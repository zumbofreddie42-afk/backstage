import Link from "next/link";
import { Panel, StaffPage } from "@/components/staff";
import { Badge } from "@/components/ui";
import { countPlaceholders, getByPath, SECTIONS } from "@/lib/content/editor";
import { requireStaff } from "@/server/auth";
import { getStore } from "@/server/store";

export default async function ContentIndex() {
  await requireStaff("admin");
  const content = await getStore().getContent();
  return (
    <StaffPage title="Contenuti del sito" intro="Testi in italiano e in inglese. I testi tra {{parentesi graffe}} sono segnaposto: sostituiscili con i dati ufficiali, oppure cancellali.">
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((s) => {
          const paths = [...s.fields.map((f) => f.key), ...s.lists.map((l) => l.path)];
          const missing = paths.reduce((n, p) => n + countPlaceholders(getByPath(content, p)), 0);
          return (
            <Link key={s.key} href={`/staff/contenuti/${s.key}`} className="block rounded-2xl hover:ring-2 hover:ring-primary">
              <Panel className="h-full">
                <p className="flex flex-wrap items-center gap-2 font-display text-lg font-extrabold text-ink">
                  {s.title} {missing > 0 ? <Badge tone="warn">{missing} da completare</Badge> : <Badge tone="ok">completo</Badge>}
                </p>
                <p className="mt-1 text-muted-foreground">{s.description}</p>
              </Panel>
            </Link>
          );
        })}
      </div>
    </StaffPage>
  );
}
