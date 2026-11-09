import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { loginAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = { title: "Anmeldung" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <form action={loginAction} className="w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-6">
          <div className="font-serif text-2xl text-ink-950">Sales Command Center</div>
          <p className="mt-1 text-sm text-ink-500">Interner Bereich – bitte anmelden.</p>
        </div>
        {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label className="label" htmlFor="email">E-Mail</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="input mb-4" />
        <label className="label" htmlFor="password">Passwort</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input mb-6" />
        <SubmitButton className="btn-primary w-full" pendingText="Anmelden …">Anmelden</SubmitButton>
      </form>
    </main>
  );
}
