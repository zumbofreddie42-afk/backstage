import Link from "next/link";
import type { Account } from "@/lib/domain";
import type { Dictionary, Locale } from "@/lib/i18n";
import { logout } from "@/app/[lang]/area/actions";
import { Container } from "@/components/ui";

export function AreaBar({ account, d, locale, current }: { account: Account; d: Dictionary; locale: Locale; current: "dashboard" | "tutor" }) {
  const link = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="rounded-full px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 aria-[current=page]:bg-white aria-[current=page]:text-primary"
    >
      {label}
    </Link>
  );
  return (
    <div className="bg-ink text-white">
      <Container className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#f1c6fb]">
            {d.area.title}
            {account.role === "guardian" && ` · ${d.area.guardianView}`}
          </p>
          <p className="font-display text-lg font-extrabold">
            {d.area.hello}, {account.name}
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {link(`/${locale}/area`, d.area.title, current === "dashboard")}
          {link(`/${locale}/area/tutor`, d.tutor.title, current === "tutor")}
          <form action={logout}>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className="rounded-full px-4 py-2 text-sm font-semibold text-white/85 underline underline-offset-4 hover:bg-white/10">
              {d.area.logout}
            </button>
          </form>
        </nav>
      </Container>
    </div>
  );
}
