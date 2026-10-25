import { buttonClass, Container } from "@/components/ui";
import { requireAccount } from "@/server/auth";
import { loadSite } from "@/server/site";
import { changePassword } from "../actions";

export default async function PasswordPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ errore?: string }> }) {
  const { locale, d } = await loadSite((await params).lang);
  await requireAccount(locale);
  const { errore } = await searchParams;
  const a = d.area;
  return (
    <Container className="flex justify-center py-16">
      <form action={changePassword} className="w-full max-w-md rounded-[2rem] border-2 border-border bg-white p-7">
        <input type="hidden" name="locale" value={locale} />
        <h1 className="text-3xl font-extrabold text-ink">{a.changePasswordTitle}</h1>
        <p className="mt-2 text-muted-foreground">{a.changePasswordIntro}</p>
        {errore && (
          <p role="alert" className="mt-4 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger">
            {a.passwordMismatch}
          </p>
        )}
        <label htmlFor="password" className="mt-5 block font-semibold">
          {a.newPassword}
        </label>
        <input id="password" name="password" type="password" minLength={10} autoComplete="new-password" required className="field mt-1" />
        <label htmlFor="confirm" className="mt-4 block font-semibold">
          {a.confirmPassword}
        </label>
        <input id="confirm" name="confirm" type="password" minLength={10} autoComplete="new-password" required className="field mt-1" />
        <button type="submit" className={buttonClass("primary", "mt-6 w-full")}>
          {a.savePassword}
        </button>
      </form>
    </Container>
  );
}
