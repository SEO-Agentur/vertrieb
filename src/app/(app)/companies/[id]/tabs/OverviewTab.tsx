import Link from "next/link";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { Section, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { CompanyForm } from "../../CompanyForm";
import { updateCompanyAction, setStageAction, addNoteAction, addTaskAction, toggleTaskAction, deleteCompanyAction } from "../../actions";
import { date, eur, dateTime } from "@/lib/format";
import type { TabProps } from "./types";

export default async function OverviewTab({ companyId, user }: TabProps) {
  const [company, stages, tasks, icp, next] = await Promise.all([
    db.company.findUniqueOrThrow({ where: { id: companyId }, include: { room: true, contacts: true } }),
    db.pipelineStage.findMany({ where: { tenantId: user.tenantId }, orderBy: { order: "asc" } }),
    db.task.findMany({ where: { companyId }, orderBy: [{ doneAt: "asc" }, { dueAt: "asc" }] }),
    getSetting(user.tenantId, "icp"),
    db.meeting.findFirst({ where: { companyId, status: { in: ["SCHEDULED", "ACCEPTED", "REQUESTED", "OFFERED"] } }, orderBy: { createdAt: "desc" } }),
  ]);
  const checklist: [string, boolean, string][] = [
    ["Ansprechpartner angelegt", company.contacts.length > 0, "contacts"],
    ["Qualifiziert", company.qualificationStatus === "QUALIFIED", "qualification"],
    ["Recherche durchgeführt", !!company.researchedAt, "research"],
    ["Kundenwelt erstellt", !!company.room, "room"],
    ["Kundenwelt veröffentlicht", company.room?.status === "PUBLISHED", "room"],
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Section title="Stammdaten & Recherchefelder">
          <CompanyForm action={updateCompanyAction.bind(null, companyId)} company={company} industries={icp.preferredIndustries} submitLabel="Speichern" />
        </Section>
      </div>
      <div className="space-y-6">
        <Section title="Nächste Schritte">
          <ul className="space-y-1.5 text-sm">
            {checklist.map(([label, done, tab]) => (
              <li key={label} className="flex items-center gap-2">
                <span className={`inline-block h-4 w-4 rounded-full border ${done ? "border-emerald-500 bg-emerald-500" : "border-ink-300"}`} />
                <Link href={`/companies/${companyId}?tab=${tab}`} className={done ? "text-ink-400 line-through" : "hover:underline"}>{label}</Link>
              </li>
            ))}
          </ul>
          {next && <p className="mt-3 text-xs text-ink-500">Offenes Gespräch: {next.status}{next.scheduledAt ? ` · ${dateTime(next.scheduledAt)}` : ""}</p>}
        </Section>
        <Section title="Pipeline">
          <form action={setStageAction.bind(null, companyId)} className="space-y-3">
            <select name="stageId" defaultValue={company.stageId ?? ""} className="input" data-testid="stage-select">
              {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input name="dealValue" placeholder="Auftragswert (€)" defaultValue={company.dealValue ?? ""} className="input" />
            <input name="lostReason" placeholder="Verlustgrund (falls verloren)" defaultValue={company.lostReason ?? ""} className="input" />
            <SubmitButton className="btn-secondary w-full">Phase speichern</SubmitButton>
          </form>
          {company.dealValue != null && <p className="mt-2 text-xs text-ink-500">Auftragswert: {eur(company.dealValue)}</p>}
        </Section>
        <Section title="Notiz / Aktivität erfassen">
          <form action={addNoteAction.bind(null, companyId)} className="space-y-2">
            <select name="type" className="input"><option value="NOTE">Notiz</option><option value="CALL">Telefonat</option><option value="EMAIL">E-Mail</option><option value="LINKEDIN">LinkedIn</option><option value="MEETING">Termin</option></select>
            <input name="title" placeholder="Titel" className="input" />
            <textarea name="body" rows={3} required className="input" placeholder="Inhalt" />
            <SubmitButton className="btn-secondary w-full">Erfassen</SubmitButton>
          </form>
        </Section>
        <Section title="Aufgaben">
          <ul className="mb-3 space-y-1 text-sm">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <form action={toggleTaskAction.bind(null, t.id)}><button className={`h-4 w-4 rounded border ${t.doneAt ? "border-emerald-500 bg-emerald-500" : "border-ink-300"}`} aria-label="erledigt" /></form>
                <span className={t.doneAt ? "text-ink-400 line-through" : ""}>{t.title}</span>
                {t.dueAt && <Badge tone={!t.doneAt && t.dueAt < new Date() ? "red" : "gray"}>{date(t.dueAt)}</Badge>}
              </li>
            ))}
          </ul>
          <form action={addTaskAction} className="flex gap-2">
            <input type="hidden" name="companyId" value={companyId} />
            <input name="title" required placeholder="Neue Aufgabe" className="input" />
            <input name="dueAt" type="date" className="input w-36" />
            <SubmitButton className="btn-secondary">+</SubmitButton>
          </form>
        </Section>
        {user.role !== "VIEWER" && (
          <form action={deleteCompanyAction.bind(null, companyId)}>
            <SubmitButton className="btn-danger w-full" confirm="Unternehmen inkl. aller Daten, Kundenwelt und Angebote endgültig löschen?">Unternehmen löschen (DSGVO)</SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
