"use client";
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-red-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-red-800">Die Aktion konnte nicht ausgeführt werden</h2>
      <p className="mt-2 text-sm text-ink-600">{process.env.NODE_ENV !== "production" ? error.message : "Bitte Eingaben prüfen und erneut versuchen."}</p>
      {error.digest && <p className="mt-1 text-xs text-ink-400">Referenz: {error.digest}</p>}
      <div className="mt-4 flex gap-2"><button className="btn-primary" onClick={reset}>Erneut versuchen</button><button className="btn-secondary" onClick={() => history.back()}>Zurück</button></div>
    </div>
  );
}
