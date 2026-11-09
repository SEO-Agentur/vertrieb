/** Neutrale Zugangsseite – verrät weder Existenz noch Namen einer Kundenwelt. */
export function AccessDenied({ status }: { status?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-8 h-px w-16 bg-ink-300" />
        <h1 className="font-serif text-3xl text-ink-950">Zugang nur über persönliche Einladung</h1>
        <p className="mt-4 text-ink-600">
          Diese Seite ist ausschließlich über einen persönlichen Einladungslink erreichbar.
          {status === "limit" ? " Bitte versuchen Sie es in einigen Minuten erneut." : " Falls Ihr Link nicht mehr funktioniert, ist er möglicherweise abgelaufen. Bitte wenden Sie sich an Ihren Ansprechpartner, um einen neuen Link zu erhalten."}
        </p>
        <div className="mx-auto mt-8 h-px w-16 bg-ink-300" />
      </div>
    </main>
  );
}
