import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Section, Badge, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { date } from "@/lib/format";
import { addTaskAction, toggleTaskAction } from "../companies/actions";

export const metadata = { title: "Aufgaben" };

export default async function TasksPage() {
  const user = await requireUser();
  const [open, done, companies, followUps] = await Promise.all([
    db.task.findMany({ where: { tenantId: user.tenantId, doneAt: null }, orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }], include: { company: { select: { id: true, name: true } } } }),
    db.task.findMany({ where: { tenantId: user.tenantId, doneAt: { not: null } }, orderBy: { doneAt: "desc" }, take: 20, include: { company: { select: { id: true, name: true } } } }),
    db.company.findMany({ where: { tenantId: user.tenantId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.outreachMessage.findMany({ where: { tenantId: user.tenantId, status: "SENT", followUpAt: { lte: new Date(Date.now() + 2 * 86400_000) } }, include: { company: { select: { id: true, name: true } }, contact: { select: { firstName: true, lastName: true } } } }),
  ]);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <PageHeader title="Aufgaben" />
        <Section title={`Offen (${open.length})`}>
          {open.length === 0 ? <Empty>Keine offenen Aufgaben.</Empty> : (
            <ul className="space-y-2 text-sm">{open.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <form action={toggleTaskAction.bind(null, t.id)}><button className="h-4 w-4 rounded border border-ink-300" aria-label="erledigt" /></form>
                <span>{t.title}</span>
                {t.company && <Link className="text-xs text-ink-500 hover:underline" href={`/companies/${t.company.id}`}>{t.company.name}</Link>}
                {t.dueAt && <Badge tone={t.dueAt < new Date() ? "red" : "gray"}>{date(t.dueAt)}</Badge>}
              </li>
            ))}</ul>
          )}
        </Section>
        <Section title="Fällige Follow-ups (Outreach)">
          {followUps.length === 0 ? <Empty>Keine fälligen Follow-ups.</Empty> : <ul className="space-y-1 text-sm">{followUps.map((f) => <li key={f.id}><Link className="hover:underline" href={`/companies/${f.company.id}?tab=outreach`}>{f.company.name}</Link> · {f.contact ? `${f.contact.firstName} ${f.contact.lastName}` : ""} <Badge tone="amber">{date(f.followUpAt)}</Badge></li>)}</ul>}
        </Section>
        <Section title="Zuletzt erledigt">
          <ul className="space-y-1 text-sm text-ink-400">{done.map((t) => <li key={t.id} className="flex items-center gap-2"><form action={toggleTaskAction.bind(null, t.id)}><button className="h-4 w-4 rounded border border-emerald-500 bg-emerald-500" aria-label="wieder öffnen" /></form><span className="line-through">{t.title}</span></li>)}</ul>
        </Section>
      </div>
      <Section title="Neue Aufgabe">
        <form action={addTaskAction} className="space-y-2">
          <input name="title" required placeholder="Titel" className="input" />
          <textarea name="description" placeholder="Beschreibung" className="input" />
          <select name="companyId" className="input"><option value="">ohne Unternehmen</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input name="dueAt" type="date" className="input" />
          <SubmitButton className="btn-primary w-full">Anlegen</SubmitButton>
        </form>
      </Section>
    </div>
  );
}
