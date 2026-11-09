import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { integrationStates } from "@/lib/integrations";
import { roleLabels } from "@/lib/normalize";
import { PageHeader, Section, Field, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { dateTime } from "@/lib/format";
import * as A from "./actions";

const TABS = [["profile", "Profil"], ["icp", "Zielkunden (ICP)"], ["scoring", "Lead-Scoring"], ["pipeline", "Pipeline"], ["brand", "Positionierung"], ["privacy", "Datenschutz"], ["integrations", "Integrationen"], ["users", "Benutzer"], ["audit", "Audit-Log"]] as const;

export const metadata = { title: "Einstellungen" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser();
  const { tab = "profile" } = await searchParams;
  const isAdmin = user.role === "ADMIN";
  const t = user.tenantId;
  return (
    <div>
      <PageHeader title="Einstellungen" />
      <nav className="mb-5 flex flex-wrap gap-1 border-b border-ink-200">
        {TABS.map(([k, l]) => <Link key={k} href={`/settings?tab=${k}`} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === k ? "border-ink-900 font-medium" : "border-transparent text-ink-500"}`}>{l}</Link>)}
      </nav>
      {!isAdmin && tab !== "profile" && <p className="mb-4 rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">Nur Administratoren können diese Einstellungen ändern.</p>}

      {tab === "profile" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Beraterprofil (in Kundenwelten sichtbar)">
            <form action={A.saveProfileAction} className="space-y-3">
              <Field label="Name"><input name="name" defaultValue={user.name} className="input" /></Field>
              <Field label="Titel"><input name="title" defaultValue={user.title ?? ""} className="input" /></Field>
              <Field label="Telefon"><input name="phone" defaultValue={user.phone ?? ""} className="input" /></Field>
              <Field label="Kurzprofil"><textarea name="bio" rows={3} defaultValue={user.bio ?? ""} className="input" /></Field>
              <Field label="Foto-URL"><input name="avatarUrl" defaultValue={user.avatarUrl ?? ""} className="input" /></Field>
              <Field label="Terminbuchungs-Link (z.B. Kalender)"><input name="calendarUrl" defaultValue={user.calendarUrl ?? ""} className="input" /></Field>
              <Field label="LinkedIn"><input name="linkedinUrl" defaultValue={user.linkedinUrl ?? ""} className="input" /></Field>
              <SubmitButton>Speichern</SubmitButton>
            </form>
          </Section>
          <Section title="Passwort ändern">
            <form action={A.changePasswordAction} className="space-y-3">
              <Field label="Aktuelles Passwort"><input name="current" type="password" required className="input" autoComplete="current-password" /></Field>
              <Field label="Neues Passwort (min. 10 Zeichen)"><input name="next" type="password" required minLength={10} className="input" autoComplete="new-password" /></Field>
              <SubmitButton className="btn-secondary">Ändern (alle Sitzungen werden beendet)</SubmitButton>
            </form>
          </Section>
        </div>
      )}

      {tab === "icp" && (async () => {
        const icp = await getSetting(t, "icp");
        return (
          <Section title="Zielkundenkriterien">
            <form action={A.saveIcpAction} className="grid gap-4 md:grid-cols-2">
              <Field label="Mindestumsatz (Mio. €)"><input name="minRevenueMio" defaultValue={icp.minRevenueEur / 1e6} className="input" /></Field>
              <Field label="Zielmarkt (Land)"><input name="country" defaultValue={icp.country} className="input" /></Field>
              <Field label="Bevorzugter Umsatz von (Mio. €)"><input name="prefMinMio" defaultValue={icp.preferredRevenueMinEur / 1e6} className="input" /></Field>
              <Field label="Bevorzugter Umsatz bis (Mio. €)"><input name="prefMaxMio" defaultValue={icp.preferredRevenueMaxEur / 1e6} className="input" /></Field>
              <Field label="Bevorzugte Branchen (eine pro Zeile)"><textarea name="preferredIndustries" rows={8} defaultValue={icp.preferredIndustries.join("\n")} className="input" /></Field>
              <Field label="Niedrig priorisierte Branchen (hohe Einstiegshürden)"><textarea name="lowPriorityIndustries" rows={8} defaultValue={icp.lowPriorityIndustries.join("\n")} className="input" /></Field>
              <Field label="Bevorzugte Eigentümerstruktur"><textarea name="preferredOwnership" rows={3} defaultValue={icp.preferredOwnership.join("\n")} className="input" /></Field>
              <fieldset><span className="label">Relevante Ansprechpartnerrollen</span>
                {Object.entries(roleLabels).map(([k, v]) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" name="targetRoles" value={k} defaultChecked={icp.targetRoles.includes(k)} /> {v}</label>)}
              </fieldset>
              {isAdmin && <div><SubmitButton>Speichern</SubmitButton></div>}
            </form>
          </Section>
        );
      })()}

      {tab === "scoring" && (async () => {
        const s = await getSetting(t, "scoring");
        return (
          <Section title="Gewichtungen & Schwellenwerte" actions={isAdmin ? <form action={A.rescoreAllAction}><SubmitButton className="btn-secondary btn-sm">Alle neu bewerten</SubmitButton></form> : null}>
            <form action={A.saveScoringAction} className="grid gap-4 md:grid-cols-4">
              {([["icpFit", "ICP-Fit"], ["salesPotential", "Vertriebspotenzial"], ["digitalPotential", "Digitalisierungspotenzial"], ["economicPotential", "Wirtschaftliches Potenzial"], ["feasibility", "Umsetzbarkeit"], ["engagement", "Engagement"]] as const).map(([k, l]) => (
                <Field key={k} label={`${l} (Gewicht)`}><input name={k} type="number" min={0} max={100} defaultValue={s.weights[k]} className="input" /></Field>
              ))}
              <Field label="Schwelle „qualifizierbar“"><input name="qualified" type="number" min={0} max={100} defaultValue={s.thresholds.qualified} className="input" /></Field>
              <Field label="Schwelle „Top-Priorität“"><input name="hot" type="number" min={0} max={100} defaultValue={s.thresholds.hot} className="input" /></Field>
              {isAdmin && <div className="flex items-end"><SubmitButton>Speichern</SubmitButton></div>}
            </form>
            <p className="mt-3 text-xs text-ink-500">Gewichte werden relativ zueinander verrechnet. Unbekannte Werte fließen neutral (50 Punkte) ein und werden als Hinweis ausgewiesen.</p>
          </Section>
        );
      })()}

      {tab === "pipeline" && (async () => {
        const stages = await db.pipelineStage.findMany({ where: { tenantId: t }, orderBy: { order: "asc" }, include: { _count: { select: { companies: true } } } });
        return (
          <Section title="Pipeline-Phasen">
            <table className="table">
              <thead><tr><th>Reihenfolge</th><th>Name</th><th>Farbe</th><th>Wahrscheinlichkeit %</th><th>Unternehmen</th><th /></tr></thead>
              <tbody>{stages.map((s) => (
                <tr key={s.id}>
                  <td colSpan={4}>
                    <form action={A.saveStageAction.bind(null, s.id)} className="flex gap-2">
                      <input name="order" type="number" defaultValue={s.order} className="input w-20" />
                      <input name="name" defaultValue={s.name} className="input" />
                      <input name="color" type="color" defaultValue={s.color} className="h-9 w-12 rounded border" />
                      <input name="probability" type="number" defaultValue={s.probability} className="input w-24" />
                      {isAdmin && <SubmitButton className="btn-secondary btn-sm">Speichern</SubmitButton>}
                    </form>
                  </td>
                  <td>{s._count.companies} {s.isWon && <Badge tone="green">gewonnen</Badge>}{s.isLost && <Badge tone="red">verloren</Badge>}</td>
                  <td>{isAdmin && !s._count.companies && <form action={A.deleteStageAction.bind(null, s.id)}><SubmitButton className="btn-ghost btn-sm" confirm="Phase löschen?">×</SubmitButton></form>}</td>
                </tr>
              ))}</tbody>
            </table>
            {isAdmin && (
              <form action={A.saveStageAction.bind(null, null)} className="mt-4 flex gap-2">
                <input name="order" type="number" placeholder="Pos." className="input w-20" />
                <input name="name" required placeholder="Neue Phase" className="input" />
                <input name="color" type="color" defaultValue="#64748b" className="h-9 w-12 rounded border" />
                <input name="probability" type="number" placeholder="%" className="input w-24" />
                <SubmitButton className="btn-secondary">Hinzufügen</SubmitButton>
              </form>
            )}
            <p className="mt-3 text-xs text-ink-500">Systemphasen (z.B. „Kundenwelt besucht“) werden bei Ereignissen automatisch gesetzt – nur vorwärts, nie aus „Gewonnen/Verloren“ heraus.</p>
          </Section>
        );
      })()}

      {tab === "brand" && (async () => {
        const b = await getSetting(t, "brand");
        return (
          <Section title="Positionierung & Botschaft">
            <form action={A.saveBrandAction} className="space-y-3">
              <Field label="Firmenname des Beraters"><input name="companyName" defaultValue={b.companyName} className="input" /></Field>
              <Field label="Zentrale Botschaft"><textarea name="claim" rows={2} defaultValue={b.claim} className="input" /></Field>
              <Field label="Produktprinzip"><textarea name="positioning" rows={2} defaultValue={b.positioning} className="input" /></Field>
              {isAdmin && <SubmitButton>Speichern</SubmitButton>}
            </form>
          </Section>
        );
      })()}

      {tab === "privacy" && (async () => {
        const p = await getSetting(t, "privacy");
        const lastRun = await db.auditLog.findFirst({ where: { tenantId: t, action: "retention.run" }, orderBy: { createdAt: "desc" } });
        return (
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Fristen & Angaben">
              <form action={A.savePrivacyAction} className="grid gap-3 md:grid-cols-2">
                <Field label="Besuchersitzung gültig (Tage)"><input name="roomSessionDays" type="number" defaultValue={p.roomSessionDays} className="input" /></Field>
                <Field label="Einladung gültig (Standard, Tage)"><input name="inviteDefaultDays" type="number" defaultValue={p.inviteDefaultDays} className="input" /></Field>
                <Field label="Kundenwelt-Ereignisse aufbewahren (Tage)"><input name="roomEventRetentionDays" type="number" defaultValue={p.roomEventRetentionDays} className="input" /></Field>
                <Field label="Disqualifizierte Unternehmen löschen nach (Tagen)"><input name="disqualifiedRetentionDays" type="number" defaultValue={p.disqualifiedRetentionDays} className="input" /></Field>
                <Field label="Datenschutz-Kontakt"><input name="privacyContactEmail" defaultValue={p.privacyContactEmail} className="input" /></Field>
                <Field label="Impressum-URL"><input name="imprintUrl" defaultValue={p.imprintUrl} className="input" /></Field>
                <Field label="Datenschutzerklärung-URL"><input name="privacyUrl" defaultValue={p.privacyUrl} className="input" /></Field>
                {isAdmin && <div className="flex items-end"><SubmitButton>Speichern</SubmitButton></div>}
              </form>
            </Section>
            <Section title="Datenlöschung">
              <p className="mb-3 text-sm text-ink-600">Die Bereinigung läuft täglich im Hintergrund-Worker (<code>npm run worker</code>). Unternehmen können jederzeit vollständig gelöscht werden (Unternehmen → Übersicht → Löschen), inkl. Kontakten, Kundenwelt, Sitzungen und Angeboten.</p>
              <p className="mb-3 text-xs text-ink-500">Letzter Lauf: {lastRun ? `${dateTime(lastRun.createdAt)} – ${JSON.stringify(lastRun.meta)}` : "noch nie"}</p>
              {isAdmin && <form action={A.runRetentionAction}><SubmitButton className="btn-secondary" confirm="Bereinigung jetzt ausführen?">Bereinigung jetzt ausführen</SubmitButton></form>}
            </Section>
          </div>
        );
      })()}

      {tab === "integrations" && (async () => {
        const outbox = await db.outboxEmail.findMany({ where: { tenantId: t }, orderBy: { createdAt: "desc" }, take: 20 });
        return (
          <div className="space-y-6">
            <Section title="Status der Integrationen">
              <table className="table">
                <thead><tr><th>Integration</th><th>Status</th><th>Details</th><th>Benötigte Konfiguration</th></tr></thead>
                <tbody>{integrationStates().map((i) => (
                  <tr key={i.key}><td className="font-medium">{i.name}</td><td><Badge tone={i.enabled ? "green" : "amber"}>{i.enabled ? "aktiv" : "nicht aktiviert"}</Badge></td><td className="text-xs">{i.detail}</td><td className="text-xs text-ink-500">{i.required.join(", ")}</td></tr>
                ))}</tbody>
              </table>
              <p className="mt-3 text-xs text-ink-500">Zugangsdaten werden ausschließlich als Umgebungsvariablen gesetzt (siehe .env.example) – nie in der Datenbank.</p>
            </Section>
            <Section title="E-Mail-Postausgang">
              {outbox.length === 0 ? <p className="text-sm text-ink-500">Leer.</p> : (
                <table className="table text-xs"><thead><tr><th>Zeit</th><th>An</th><th>Betreff</th><th>Status</th><th>Inhalt</th></tr></thead>
                  <tbody>{outbox.map((m) => <tr key={m.id}><td>{dateTime(m.createdAt)}</td><td>{m.to}</td><td>{m.subject}</td><td><Badge tone={m.status === "SENT" ? "green" : m.status === "FAILED" ? "red" : "amber"}>{m.status}</Badge></td><td className="whitespace-pre-wrap" data-testid="outbox-body">{m.body}</td></tr>)}</tbody>
                </table>
              )}
            </Section>
          </div>
        );
      })()}

      {tab === "users" && (async () => {
        const users = await db.user.findMany({ where: { tenantId: t }, orderBy: { createdAt: "asc" } });
        return (
          <Section title="Benutzer & Rollen">
            <table className="table"><thead><tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th>Status</th><th /></tr></thead>
              <tbody>{users.map((u) => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td><Badge>{u.role}</Badge></td><td>{u.active ? "aktiv" : "deaktiviert"}</td><td>{isAdmin && u.id !== user.id && <form action={A.toggleUserAction.bind(null, u.id)}><SubmitButton className="btn-ghost btn-sm">{u.active ? "deaktivieren" : "aktivieren"}</SubmitButton></form>}</td></tr>)}</tbody>
            </table>
            {isAdmin && (
              <form action={A.createUserAction} className="mt-4 grid gap-2 md:grid-cols-5">
                <input name="name" required placeholder="Name" className="input" />
                <input name="email" type="email" required placeholder="E-Mail" className="input" />
                <input name="password" type="password" required minLength={10} placeholder="Startpasswort" className="input" />
                <select name="role" className="input"><option value="CONSULTANT">Berater</option><option value="VIEWER">Nur lesen</option><option value="ADMIN">Administrator</option></select>
                <SubmitButton className="btn-secondary">Anlegen</SubmitButton>
              </form>
            )}
          </Section>
        );
      })()}

      {tab === "audit" && (async () => {
        const logs = await db.auditLog.findMany({ where: { tenantId: t }, orderBy: { createdAt: "desc" }, take: 200 });
        return (
          <Section title="Audit-Log (letzte 200)">
            <table className="table text-xs"><thead><tr><th>Zeit</th><th>Akteur</th><th>Aktion</th><th>Objekt</th><th>Details</th></tr></thead>
              <tbody>{logs.map((l) => <tr key={l.id}><td className="whitespace-nowrap">{dateTime(l.createdAt)}</td><td>{l.actorType}</td><td>{l.action}</td><td>{l.entity} {l.entityId?.slice(-6)}</td><td className="max-w-md truncate">{l.meta ? JSON.stringify(l.meta) : ""}</td></tr>)}</tbody>
            </table>
          </Section>
        );
      })()}
    </div>
  );
}
