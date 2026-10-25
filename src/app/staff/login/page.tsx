import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { buttonClass } from "@/components/ui";
import { getStaffSession, isDevPassword, staffLoginAvailable, staffRoleForPassword, startStaffSession } from "@/server/auth";
import { allow, clientKey } from "@/server/rate-limit";

export const metadata: Metadata = { title: "Accesso scuola" };

async function login(formData: FormData) {
  "use server";
  if (!allow(await clientKey("staff-login"), 8, 15 * 60_000)) redirect("/staff/login?errore=troppi");
  const role = staffRoleForPassword(String(formData.get("password") ?? ""));
  if (!role) redirect("/staff/login?errore=1");
  await startStaffSession(role);
  redirect("/staff");
}

export default async function StaffLoginPage({ searchParams }: { searchParams: Promise<{ errore?: string }> }) {
  if (await getStaffSession()) redirect("/staff");
  const { errore } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-ink to-primary px-4">
      <form action={login} className="w-full max-w-sm rounded-[2rem] bg-white p-7">
        <Image src="/brand/backstage-logo.jpg" alt="Backstage Online Languages" width={150} height={150} className="h-16 w-16 rounded-full" />
        <h1 className="mt-4 text-3xl font-extrabold text-ink">Area di Christina</h1>
        <p className="mt-1 text-muted-foreground">Pannello di gestione di Backstage</p>
        {errore && (
          <p role="alert" className="mt-4 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger">
            {errore === "troppi" ? "Troppi tentativi: riprova tra qualche minuto." : "Password non corretta."}
          </p>
        )}
        {!staffLoginAvailable() ? (
          <p className="mt-4 text-sm">Accesso non configurato: imposta ADMIN_PASSWORD nelle variabili d&apos;ambiente.</p>
        ) : (
          <>
            <label htmlFor="password" className="mt-5 block font-semibold">
              Password
            </label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="field mt-1" />
            {isDevPassword() && <p className="mt-2 text-sm text-muted-foreground">Prova in locale: la password è «anteprima».</p>}
            <button type="submit" className={buttonClass("primary", "mt-5 w-full")}>
              Entra
            </button>
          </>
        )}
      </form>
    </main>
  );
}
