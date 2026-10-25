import Image from "next/image";
import Link from "next/link";
import { requireStaff } from "@/server/auth";
import { getSiteMode } from "@/server/config";
import { getStore } from "@/server/store";
import { logoutStaff } from "../actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff();
  const unread = (await getStore().list("messages", (m) => !m.read)).length;
  const preview = getSiteMode() === "preview";
  const links = [
    { href: "/staff", label: "Riepilogo" },
    { href: "/staff/studenti", label: "Studenti" },
    { href: "/staff/richieste", label: `Richieste${unread ? ` (${unread})` : ""}` },
    { href: "/staff/promemoria", label: "Promemoria" },
    ...(session.role === "admin" ? [{ href: "/staff/contenuti", label: "Contenuti del sito" }] : []),
  ];
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_1fr]">
      <aside className="bg-ink text-white lg:sticky lg:top-0 lg:h-dvh">
        <div className="flex items-center justify-between gap-3 p-4 lg:block lg:p-5">
          <Link href="/staff" className="flex items-center gap-3">
            <Image src="/brand/backstage-logo.jpg" alt="" width={150} height={150} className="h-10 w-10 rounded-full" />
            <span className="font-display font-extrabold leading-tight">
              Backstage
              <span className="block text-xs font-semibold text-ink-muted">{session.role === "admin" ? "Amministrazione" : "Insegnante"}</span>
            </span>
          </Link>
          <form action={logoutStaff} className="lg:mt-4">
            <button type="submit" className="text-sm font-semibold text-ink-muted underline underline-offset-4 hover:text-white">
              Esci
            </button>
          </form>
        </div>
        <nav aria-label="Pannello" className="overflow-x-auto px-2 pb-3 lg:px-3">
          <ul className="flex gap-1 lg:flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block whitespace-nowrap rounded-xl px-3 py-2 font-semibold text-white/85 hover:bg-white/10 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a href="/it" target="_blank" className="block whitespace-nowrap rounded-xl px-3 py-2 font-semibold text-white/60 hover:bg-white/10 hover:text-white">
                Apri il sito ↗
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="min-w-0 p-4 sm:p-8">
        {preview && (
          <p className="mb-6 rounded-xl border-2 border-dashed border-magenta bg-magenta-soft px-4 py-2 text-sm font-semibold text-magenta-strong">
            Anteprima: sono presenti dati dimostrativi fittizi (contrassegnati «demo»). Nel sito pubblicato vengono esclusi.
          </p>
        )}
        {children}
      </main>
    </div>
  );
}
