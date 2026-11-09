"use client";
import { useState } from "react";

const SECTIONS: [string, string][] = [
  ["greeting", "Begrüßung"], ["calculator", "Umsatzrechner"], ["areas", "Verbesserungsbereiche"], ["approach", "Beratungsansatz"],
  ["video", "Live-Beratung"], ["solutions", "Lösungen"], ["offer", "Angebot"], ["next", "Nächste Schritte"],
];

/** Präsentationsmodus: Der Besucher folgt nur, wenn er in seiner Kundenwelt ausdrücklich zugestimmt hat. */
export function PresenterControls({ meetingId, initialActive, initialSection, hasRoom }: { meetingId: string; initialActive: boolean; initialSection: string | null; hasRoom: boolean }) {
  const [active, setActive] = useState(initialActive);
  const [section, setSection] = useState<string | null>(initialSection);
  const [error, setError] = useState<string | null>(null);

  async function send(next: { active: boolean; section?: string }) {
    setError(null);
    const res = await fetch(`/api/meetings/${meetingId}/presenter`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(next) });
    if (!res.ok) return setError("Konnte Präsentationsmodus nicht aktualisieren.");
    const data = await res.json();
    setActive(data.active);
    setSection(data.section);
  }

  if (!hasRoom) return <p className="text-xs text-ink-500">Gemeinsames Navigieren ist verfügbar, sobald eine Kundenwelt existiert.</p>;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button data-testid="presenter-toggle" className={active ? "btn-primary btn-sm" : "btn-secondary btn-sm"} onClick={() => send({ active: !active, section: section ?? "greeting" })}>
          {active ? "Gemeinsam navigieren: AN" : "Gemeinsam navigieren starten"}
        </button>
        <span className="text-xs text-ink-500">Der Besucher muss dem Folgen zustimmen und kann es jederzeit beenden.</span>
      </div>
      {active && (
        <div className="flex flex-wrap gap-1">
          {SECTIONS.map(([key, label]) => (
            <button key={key} data-testid={`presenter-section-${key}`} onClick={() => send({ active: true, section: key })} className={section === key ? "btn-primary btn-sm" : "btn-secondary btn-sm"}>{label}</button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
