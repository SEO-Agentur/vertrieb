/** Hero-Grafik: Vertriebsprozess als Pfeilkette mit den drei Hebeln Daten, Automatisierung, KI. */
export function SalesFlow() {
  const steps = ["Leads", "Ansprache", "Qualifizierung", "Angebote", "Abschlüsse"];
  return (
    <div aria-hidden className="relative hidden select-none lg:block">
      <div className="mb-8 flex justify-between px-10">
        <Lever title="Daten" text="Mehr Transparenz, bessere Entscheidungen" icon="M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
        <Lever title="Automatisierung" text="Weniger Aufwand, schnellere Prozesse" icon="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L14.8 3h-4l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2l-2 1.6 2 3.4 2.4-1c.5.4 1.1.7 1.7 1l.4 2.4h4l.4-2.6c.6-.3 1.2-.6 1.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" />
      </div>
      <div className="flex">
        {steps.map((s, i) => (
          <div key={s} className={`relative -ml-2 flex h-14 min-w-0 flex-1 items-center justify-center text-[12.5px] font-semibold first:ml-0 ${i === steps.length - 1 ? "bg-site-blue text-white" : "bg-white/90 text-site-navy"}`} style={{ clipPath: i === 0 ? "polygon(0 0,88% 0,100% 50%,88% 100%,0 100%)" : "polygon(0 0,88% 0,100% 50%,88% 100%,0 100%,12% 50%)" }}>
            <span className={`truncate ${i === 0 ? "pr-2" : "pl-3 pr-1"}`}>{s}</span>
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-center pl-24">
        <Lever title="KI" text="Höhere Relevanz, mehr Abschlüsse" icon="M5 20V12m5 8V8m5 12v-6m5 6V4" />
      </div>
    </div>
  );
}

function Lever({ title, text, icon }: { title: string; text: string; icon: string }) {
  return (
    <div className="flex max-w-[190px] items-start gap-3 rounded-md bg-white/10 p-3 backdrop-blur-sm">
      <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d={icon} /></svg>
      <div><div className="text-sm font-bold text-white">{title}</div><div className="text-xs leading-snug text-white/75">{text}</div></div>
    </div>
  );
}

/** Code-basiertes Mockup einer persönlichen Kundenwelt (dekorativ, fiktives Beispielunternehmen). */
export function KundenweltMockup() {
  const nav = ["Willkommen", "Unternehmensanalyse", "Potenzialberechnung", "Projektvorschlag", "Kommunikation", "Video-Meeting"];
  return (
    <div aria-hidden className="relative">
      <div className="overflow-hidden rounded-xl border border-site-line bg-white shadow-2xl shadow-site-navy/20">
        <div className="flex items-center gap-2 border-b border-site-line bg-site-sky px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 flex-1 truncate rounded bg-white px-3 py-1 text-[11px] text-site-text">🔒 angebote.beispiel-gmbh.de/willkommen</span>
        </div>
        <div className="grid grid-cols-[150px_1fr] text-[11px]">
          <div className="bg-site-navy p-3 text-white/80">
            <div className="mb-4 text-sm font-extrabold text-white">Beispiel GmbH</div>
            {nav.map((n, i) => <div key={n} className={`mb-1 rounded px-2 py-1.5 ${i === 0 ? "bg-site-blue text-white" : ""}`}>{n}</div>)}
          </div>
          <div className="relative space-y-3 bg-white p-4">
            <span className="absolute right-3 top-3 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">Beispiel</span>
            <div className="text-base font-extrabold text-site-navy">Willkommen in Ihrer Kundenwelt</div>
            <div className="text-site-text">Ihr zentraler Bereich für Analyse, Potenziale und Projektumsetzung.</div>
            <div className="grid grid-cols-3 gap-2">
              {[["+0,05 %", "50.000 €", 25], ["+0,1 %", "100.000 €", 45], ["+0,5 %", "500.000 €", 95]].map(([a, b, h]) => (
                <div key={String(a)} className="rounded border border-site-line p-2">
                  <div className="text-site-text">{a}</div><div className="font-bold text-site-navy">{b}</div>
                  <div className="mt-1 h-10 rounded bg-site-sky"><div className="w-full rounded bg-site-blue" style={{ height: `${h}%`, marginTop: `${100 - Number(h)}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">{["Angebotserstellung", "Leadqualifizierung", "Bestandskunden"].map((t) => <span key={t} className="rounded-full border border-site-line px-2 py-0.5 text-site-navy">{t} · <em className="not-italic text-site-text">Hypothese</em></span>)}</div>
            <div className="flex items-center justify-between rounded border border-site-line p-2">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Ihr Ansprechpartner ist verfügbar</span>
              <span className="rounded bg-site-blue px-2 py-1 font-semibold text-white">Videogespräch starten</span>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-site-text">Darstellung mit fiktivem Beispielunternehmen und Beispielwerten</p>
    </div>
  );
}

export function LineIcon({ d }: { d: string }) {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-site-navy" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

export const ICONS = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.3-4.3",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
  chat: "M4 5h16v11H8l-4 4V5Z",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z",
  db: "M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  chart: "M5 20V12m5 8V8m5 12v-6m5 6V4",
  cube: "m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10 9-5M12 12 3 7m9 5v10",
  doc: "M7 3h7l5 5v13H7V3Zm7 0v5h5M10 13h6m-6 4h6",
  users: "M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6 7c0-1.7-1-3.1-2.5-3.7M17 6.5a2.5 2.5 0 0 1 0 5M6 19c0-1.7 1-3.1 2.5-3.7M7 6.5a2.5 2.5 0 0 0 0 5",
  code: "m8 8-4 4 4 4m8-8 4 4-4 4M14 5l-4 14",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
  check: "m5 12 5 5L20 7",
};
