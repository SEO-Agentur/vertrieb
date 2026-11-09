import type { TabProps } from "./types";
import { db } from "@/lib/db";
import { Badge, Field, Section, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { DEFAULT_MODULES, ROOM_MODULES, roomUrl, type RoomModules } from "@/lib/rooms";
import { sanitizeInputs, type CalculatorInputs } from "@/lib/calculator";
import { dateTime, relative } from "@/lib/format";
import {
  createRoomAction, updateRoomAction, setRoomStatusAction, toggleHypothesisVisibilityAction, revokeInviteAction,
  uploadDocumentAction, setDocumentVisibilityAction, deleteDocumentAction, replyRoomMessageAction,
} from "@/app/(app)/rooms/actions";
import { InviteCreator } from "@/app/(app)/rooms/InviteCreator";

export default async function RoomTab({ companyId, user }: TabProps) {
  const room = await db.room.findUnique({
    where: { companyId },
    include: {
      invites: { orderBy: { createdAt: "desc" }, include: { contact: { select: { firstName: true, lastName: true } } } },
      documents: { orderBy: { createdAt: "desc" } },
      sessions: { orderBy: { lastSeenAt: "desc" }, take: 10 },
      messages: { orderBy: { createdAt: "desc" }, take: 20 },
      _count: { select: { events: true, sessions: true } },
    },
  });
  const editor = user.role !== "VIEWER";

  if (!room) {
    return (
      <Section title="Kundenwelt">
        <p className="mb-4 max-w-2xl text-sm text-ink-600">Erstellt eine persönliche, geschützte Seite für dieses Unternehmen aus den vorhandenen Daten. Die Kundenwelt bleibt ein Entwurf, bis Sie sie veröffentlichen; Zugriff besteht nur über Einladungslinks.</p>
        {editor && (
          <form action={createRoomAction.bind(null, companyId)} className="flex items-end gap-3">
            <Field label="Sprache"><select name="language" className="input"><option value="de">Deutsch</option><option value="en">Englisch</option></select></Field>
            <SubmitButton pendingText="Erstelle …"><span data-testid="create-room">Kundenwelt erstellen</span></SubmitButton>
          </form>
        )}
      </Section>
    );
  }

  const [contacts, hypotheses, users] = await Promise.all([
    db.contact.findMany({ where: { companyId }, orderBy: [{ isPrimary: "desc" }, { lastName: "asc" }] }),
    db.improvementHypothesis.findMany({ where: { companyId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    db.user.findMany({ where: { tenantId: user.tenantId, active: true }, select: { id: true, name: true } }),
  ]);
  const modules: RoomModules = { ...DEFAULT_MODULES, ...(room.modules as Partial<RoomModules>) };
  const calc = sanitizeInputs(room.calculator as Partial<CalculatorInputs>);
  const now = new Date();
  const statusBadge = room.status === "PUBLISHED" ? <Badge tone="green">veröffentlicht</Badge> : room.status === "ARCHIVED" ? <Badge>archiviert</Badge> : <Badge tone="amber">Entwurf</Badge>;
  const activeSessions = room.sessions.filter((s) => s.presenceConsent && now.getTime() - s.lastSeenAt.getTime() < 45_000);

  return (
    <div className="space-y-6">
      <Section
        title="Status & Veröffentlichung"
        actions={editor && (
          <div className="flex gap-2">
            {room.status !== "PUBLISHED" && <form action={setRoomStatusAction.bind(null, room.id, "PUBLISHED")}><SubmitButton className="btn-primary btn-sm"><span data-testid="publish-room">Veröffentlichen</span></SubmitButton></form>}
            {room.status === "PUBLISHED" && <form action={setRoomStatusAction.bind(null, room.id, "DRAFT")}><SubmitButton className="btn-secondary btn-sm" confirm="Kundenwelt zurückziehen? Einladungslinks funktionieren dann nicht mehr.">Zurückziehen</SubmitButton></form>}
            {room.status !== "ARCHIVED" && <form action={setRoomStatusAction.bind(null, room.id, "ARCHIVED")}><SubmitButton className="btn-ghost btn-sm" confirm="Kundenwelt archivieren?">Archivieren</SubmitButton></form>}
          </div>
        )}
      >
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {statusBadge}
          <span className="font-mono text-xs text-ink-500">{roomUrl(room.slug)}</span>
          <span className="text-ink-500">Aufruf nur mit gültiger Einladung – die URL allein gewährt keinen Zugriff.</span>
        </div>
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-4">
          <div><div className="text-xs text-ink-500">Sitzungen gesamt</div><div className="text-lg font-semibold tabular-nums">{room._count.sessions}</div></div>
          <div><div className="text-xs text-ink-500">Ereignisse</div><div className="text-lg font-semibold tabular-nums">{room._count.events}</div></div>
          <div><div className="text-xs text-ink-500">Letzter Besuch</div><div>{room.sessions[0] ? relative(room.sessions[0].lastSeenAt) : "–"}</div></div>
          <div><div className="text-xs text-ink-500">Jetzt aktiv (mit Einwilligung)</div><div className="text-lg font-semibold tabular-nums">{activeSessions.length}</div></div>
        </div>
        <p className="mt-4 text-xs text-ink-500">Vorschau als Interessent: Erzeugen Sie unten einen Einladungslink (z. B. Bezeichnung „Vorschau“, 1 Tag gültig, 1 Aufruf) und öffnen Sie ihn in einem privaten Browserfenster. Widerrufen Sie ihn anschließend.</p>
      </Section>

      <Section title="Einladungen">
        {editor && <InviteCreator roomId={room.id} contacts={contacts.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}${c.title ? ` – ${c.title}` : ""}`, email: c.email }))} />}
        <div className="mt-5 overflow-x-auto">
          {room.invites.length === 0 ? <Empty>Noch keine Einladungen.</Empty> : (
            <table className="table">
              <thead><tr><th>Bezeichnung</th><th>Für</th><th>Status</th><th>Gültig bis</th><th>Aufrufe</th><th>Zuletzt</th><th /></tr></thead>
              <tbody>
                {room.invites.map((i) => {
                  const st = i.revokedAt ? ["widerrufen", "red"] : i.expiresAt < now ? ["abgelaufen", "gray"] : i.maxUses != null && i.useCount >= i.maxUses ? ["aufgebraucht", "gray"] : ["aktiv", "green"];
                  return (
                    <tr key={i.id} data-testid="invite-row">
                      <td>{i.label ?? "–"} <span className="font-mono text-xs text-ink-400">…{i.tokenHint}</span></td>
                      <td>{i.contact ? `${i.contact.firstName} ${i.contact.lastName}` : "–"}{i.email && <div className="text-xs text-ink-400">Verifizierung: {i.email}</div>}</td>
                      <td><Badge tone={st[1] as "red" | "gray" | "green"}>{st[0]}</Badge></td>
                      <td className="text-xs">{dateTime(i.expiresAt)}</td>
                      <td className="tabular-nums">{i.useCount}{i.maxUses ? ` / ${i.maxUses}` : ""}</td>
                      <td className="text-xs">{i.lastUsedAt ? relative(i.lastUsedAt) : "–"}</td>
                      <td>{editor && !i.revokedAt && <form action={revokeInviteAction.bind(null, i.id)}><SubmitButton className="btn-danger btn-sm" confirm="Einladung widerrufen? Laufende Sitzungen werden beendet.">Widerrufen</SubmitButton></form>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      <Section title="Verbesserungsbereiche in der Kundenwelt">
        <p className="mb-3 text-xs text-ink-500">Nur geprüfte, nicht verworfene Hypothesen können sichtbar geschaltet werden. In der Kundenwelt werden sie ausdrücklich als Hypothesen gekennzeichnet.</p>
        {hypotheses.length === 0 ? <Empty>Keine Hypothesen vorhanden – führen Sie zuerst eine Recherche durch (Tab „Recherche“). Ohne Hypothesen zeigt die Kundenwelt allgemeine Themenfelder.</Empty> : (
          <ul className="divide-y divide-ink-100">
            {hypotheses.map((h) => {
              const allowed = h.reviewed && h.status !== "REJECTED";
              return (
                <li key={h.id} className="flex items-start gap-3 py-2 text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{h.topic} <Badge tone={h.status === "CONFIRMED" ? "green" : h.status === "REJECTED" ? "red" : "violet"}>{h.status === "CONFIRMED" ? "bestätigt" : h.status === "REJECTED" ? "verworfen" : "Hypothese"}</Badge> {!h.reviewed && <Badge tone="amber">ungeprüft</Badge>}</div>
                    <div className="text-xs text-ink-500">{h.rationale}</div>
                  </div>
                  {editor && (
                    allowed || h.visibleInRoom ? (
                      <form action={toggleHypothesisVisibilityAction.bind(null, h.id, !h.visibleInRoom)}>
                        <SubmitButton className={h.visibleInRoom ? "btn-secondary btn-sm" : "btn-primary btn-sm"}><span data-testid="toggle-hypothesis">{h.visibleInRoom ? "Ausblenden" : "In Kundenwelt zeigen"}</span></SubmitButton>
                      </form>
                    ) : <span className="text-xs text-ink-400">erst prüfen</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {editor && (
        <form action={updateRoomAction.bind(null, room.id)}>
          <Section title="Inhalte, Gestaltung & Module" actions={<SubmitButton className="btn-primary btn-sm" pendingText="Speichere …"><span data-testid="save-room">Speichern</span></SubmitButton>}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Angezeigter Unternehmensname"><input name="displayName" defaultValue={room.displayName} className="input" /></Field>
              <Field label="Begrüßung (Überschrift)"><input name="greeting" defaultValue={room.greeting} className="input" /></Field>
              <Field label="Einleitung"><textarea name="intro" rows={4} defaultValue={room.intro} className="input" /></Field>
              <Field label="Beratungsansatz"><textarea name="approachText" rows={4} defaultValue={room.approachText} className="input" /></Field>
              <Field label="Logo-URL (https)" hint="Nur mit Erlaubnis des Unternehmens verwenden."><input name="logoUrl" defaultValue={room.logoUrl ?? ""} className="input" /></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Primärfarbe"><input type="color" name="primaryColor" defaultValue={room.primaryColor} className="h-9 w-full rounded border border-ink-200" /></Field>
                <Field label="Akzentfarbe"><input type="color" name="accentColor" defaultValue={room.accentColor} className="h-9 w-full rounded border border-ink-200" /></Field>
                <Field label="Sprache"><select name="language" defaultValue={room.language} className="input"><option value="de">Deutsch</option><option value="en">Englisch</option></select></Field>
              </div>
              <Field label="Ansprechpartner (Berater)">
                <select name="consultantId" defaultValue={room.consultantId ?? ""} className="input">{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
              </Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="requireEmailVerification" defaultChecked={room.requireEmailVerification} /> E-Mail-Verifizierung beim Zugriff verlangen</label>
            </div>
            <div className="mt-6">
              <div className="label">Module</div>
              <div className="grid gap-2 md:grid-cols-4">
                {ROOM_MODULES.map((m) => <label key={m.key} className="flex items-center gap-2 text-sm"><input type="checkbox" name={`module_${m.key}`} defaultChecked={modules[m.key]} /> {m.label}</label>)}
              </div>
            </div>
            <div className="mt-6">
              <div className="label">Umsatzpotenzial-Rechner (Startwerte)</div>
              <div className="grid gap-3 md:grid-cols-5">
                <Field label="Jahresumsatz (€)"><input name="calc_revenue" type="number" min={0} step="any" defaultValue={calc.revenueEur} className="input" /></Field>
                <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" name="calc_verified" defaultChecked={calc.revenueIsVerified} /> Umsatz verifiziert</label>
                <Field label="Szenarien (%)" hint="z. B. 0,05; 0,1; 0,5"><input name="scenarios" defaultValue={calc.scenarios.join("; ").replace(/\./g, ",")} className="input" /></Field>
                <Field label="DB-Marge (%)"><input name="calc_margin" type="number" step="any" defaultValue={calc.marginPct} className="input" /></Field>
                <Field label="Prozesskosten-Einsparung / Jahr (€)"><input name="calc_savings" type="number" step="any" defaultValue={calc.processSavingsEur} className="input" /></Field>
                <Field label="Eingesparte Stunden / Monat"><input name="calc_hours" type="number" step="any" defaultValue={calc.hoursSavedPerMonth} className="input" /></Field>
                <Field label="Kosten je Stunde (€)"><input name="calc_hourly" type="number" step="any" defaultValue={calc.hourlyCostEur} className="input" /></Field>
                <Field label="Einmalige Kosten (€)"><input name="calc_onetime" type="number" step="any" defaultValue={calc.oneTimeCostEur} className="input" /></Field>
                <Field label="Laufende Kosten / Jahr (€)"><input name="calc_running" type="number" step="any" defaultValue={calc.runningCostPerYearEur} className="input" /></Field>
              </div>
              {!calc.revenueIsVerified && <p className="mt-2 text-xs text-amber-700">Umsatz nicht verifiziert – der Besucher sieht den Wert als „Schätzung – bitte eigene Zahl eintragen“.</p>}
            </div>
          </Section>
        </form>
      )}

      <Section title="Dokumente">
        {editor && (
          <form action={uploadDocumentAction.bind(null, room.id)} className="mb-4 flex flex-wrap items-end gap-3">
            <Field label="Datei (max. 15 MB; PDF, PNG, JPG, DOCX, XLSX, PPTX)"><input type="file" name="file" required className="text-sm" accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.pptx" /></Field>
            <Field label="Sichtbarkeit"><select name="visibility" className="input"><option value="INTERNAL">Intern</option><option value="ROOM">In Kundenwelt</option></select></Field>
            <SubmitButton className="btn-secondary" pendingText="Lade hoch …">Hochladen</SubmitButton>
          </form>
        )}
        {room.documents.length === 0 ? <Empty>Keine Dokumente.</Empty> : (
          <ul className="divide-y divide-ink-100 text-sm">
            {room.documents.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-2">
                <span className="flex-1">{d.name} <span className="text-xs text-ink-400">({Math.max(1, Math.round(d.size / 1024))} KB)</span></span>
                <Badge tone={d.visibility === "ROOM" ? "blue" : "gray"}>{d.visibility === "ROOM" ? "in Kundenwelt" : "intern"}</Badge>
                {editor && <>
                  <form action={setDocumentVisibilityAction.bind(null, d.id, d.visibility === "ROOM" ? "INTERNAL" : "ROOM")}><SubmitButton className="btn-ghost btn-sm">{d.visibility === "ROOM" ? "Intern machen" : "Freigeben"}</SubmitButton></form>
                  <form action={deleteDocumentAction.bind(null, d.id)}><SubmitButton className="btn-danger btn-sm" confirm="Dokument löschen?">Löschen</SubmitButton></form>
                </>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Nachrichten aus der Kundenwelt">
        {room.messages.length === 0 ? <Empty>Keine Nachrichten.</Empty> : (
          <ul className="space-y-2 text-sm">
            {[...room.messages].reverse().map((m) => (
              <li key={m.id} className={`rounded-md px-3 py-2 ${m.fromVisitor ? "bg-ink-50" : "ml-12 bg-sky-50"}`}>
                <div className="text-xs text-ink-500">{m.authorName} · {dateTime(m.createdAt)}{m.offerId && " · zum Angebot"}{m.fromVisitor && !m.readAt && <Badge tone="amber">neu</Badge>}</div>
                <div className="whitespace-pre-line">{m.body}</div>
              </li>
            ))}
          </ul>
        )}
        {editor && (
          <form action={replyRoomMessageAction.bind(null, room.id)} className="mt-3 flex gap-2">
            <textarea name="body" rows={2} required placeholder="Antwort (für den Besucher sichtbar)" className="input" />
            <SubmitButton className="btn-secondary">Senden</SubmitButton>
          </form>
        )}
      </Section>

      <Section title="Letzte Sitzungen">
        {room.sessions.length === 0 ? <Empty>Noch keine Besuche.</Empty> : (
          <table className="table">
            <thead><tr><th>Beginn</th><th>Zuletzt aktiv</th><th>Verifiziert</th><th>Einwilligung</th><th>Abschnitt</th></tr></thead>
            <tbody>
              {room.sessions.map((s) => (
                <tr key={s.id}>
                  <td className="text-xs">{dateTime(s.createdAt)}</td>
                  <td className="text-xs">{s.presenceConsent ? relative(s.lastSeenAt) : "– (keine Einwilligung)"}</td>
                  <td>{s.verifiedAt ? <Badge tone="green">{s.verifiedEmail}</Badge> : <Badge>eingeladener Besucher</Badge>}</td>
                  <td className="text-xs">{s.consentDecidedAt ? (s.analyticsConsent ? "Anwesenheit + Nutzung" : s.presenceConsent ? "Anwesenheit" : "keine") : "offen"}</td>
                  <td className="text-xs">{s.analyticsConsent || s.presenceConsent ? s.currentSection ?? "–" : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}
