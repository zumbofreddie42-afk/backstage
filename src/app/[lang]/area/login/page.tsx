import { redirect } from "next/navigation";
import { buttonClass, Container } from "@/components/ui";
import { getCurrentAccount } from "@/server/auth";
import { loadSite } from "@/server/site";
import { DEMO_LOGINS, DEMO_PASSWORD } from "@/server/store/demo";
import { login } from "../actions";

export default async function LoginPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ errore?: string }> }) {
  const { locale, d, mode } = await loadSite((await params).lang);
  if (await getCurrentAccount()) redirect(`/${locale}/area`);
  const { errore } = await searchParams;
  const a = d.area;

  return (
    <Container className="flex justify-center py-16">
      <div className="w-full max-w-md">
        <form action={login} className="rounded-[2rem] border-2 border-border bg-white p-7 shadow-xl shadow-primary/10">
          <input type="hidden" name="locale" value={locale} />
          <h1 className="text-3xl font-extrabold text-ink">{a.loginTitle}</h1>
          <p className="mt-2 text-muted-foreground">{a.loginIntro}</p>
          {errore && (
            <p role="alert" className="mt-4 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger">
              {errore === "troppi" ? a.tooMany : a.wrongCredentials}
            </p>
          )}
          <label htmlFor="login" className="mt-5 block font-semibold">
            {a.loginName}
          </label>
          <input id="login" name="login" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required className="field mt-1" />
          <label htmlFor="password" className="mt-4 block font-semibold">
            {a.password}
          </label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="field mt-1" />
          <button type="submit" className={buttonClass("primary", "mt-6 w-full")}>
            {a.login}
          </button>
          <p className="mt-4 text-sm text-muted-foreground">{a.forgot}</p>
        </form>

        {mode === "preview" && (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-magenta bg-magenta-soft p-5 text-sm">
            <p className="font-bold text-magenta-strong">{a.demoLogins}</p>
            <ul className="mt-2 space-y-1">
              {DEMO_LOGINS.map((l) => (
                <li key={l.login}>
                  {l.label[locale]}: <code className="font-semibold">{l.login}</code>
                </li>
              ))}
            </ul>
            <p className="mt-2">
              Password: <code className="font-semibold">{DEMO_PASSWORD}</code>
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}
