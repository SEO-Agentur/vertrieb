"use client";
import { useActionState } from "react";
import { requestCodeAction, verifyCodeAction, type VerifyState } from "@/app/room/[slug]/actions";

export function VerifyEmail({ slug }: { slug: string; presetEmail?: string }) {
  const [reqState, requestCode, reqPending] = useActionState(requestCodeAction.bind(null, slug), { step: "email" } as VerifyState);
  const [verState, verify, verPending] = useActionState(verifyCodeAction.bind(null, slug), { step: "code" } as VerifyState);
  const codeStep = reqState.step === "code" && verState.step !== "email";
  const error = codeStep ? verState.error : reqState.error ?? verState.error;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-6">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-3xl text-ink-950">Bitte bestätigen Sie Ihre E-Mail-Adresse</h1>
        <p className="mt-3 text-ink-600">Zum Schutz vertraulicher Inhalte ist für diese Seite eine kurze Bestätigung erforderlich.</p>
        {error && <p className="mt-6 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {!codeStep ? (
          <form action={requestCode} className="mt-8 space-y-4">
            <label className="block"><span className="label">E-Mail-Adresse</span><input data-testid="verify-email" name="email" type="email" required className="input" /></label>
            <button className="btn-primary w-full" disabled={reqPending}>Code anfordern</button>
          </form>
        ) : (
          <form action={verify} className="mt-8 space-y-4">
            {reqState.info && <p className="text-sm text-ink-600">{reqState.info}</p>}
            <label className="block"><span className="label">Ihr Name (optional)</span><input name="name" className="input" /></label>
            <label className="block"><span className="label">Sechsstelliger Code</span><input data-testid="verify-code" name="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} className="input tracking-[0.4em]" /></label>
            <button className="btn-primary w-full" disabled={verPending}>Bestätigen</button>
          </form>
        )}
        <p className="mt-8 text-xs text-ink-400">Ihre E-Mail-Adresse wird ausschließlich zur Zugangsbestätigung verwendet.</p>
      </div>
    </main>
  );
}
