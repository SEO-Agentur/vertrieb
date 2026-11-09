import { db } from "@/lib/db";
import { Section, Badge, Field, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { roleLabels } from "@/lib/normalize";
import { saveContactAction, deleteContactAction } from "../../actions";
import type { Contact } from "@prisma/client";
import type { TabProps } from "./types";

function ContactFields({ c }: { c?: Contact }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Field label="Vorname *"><input name="firstName" defaultValue={c?.firstName} className="input" required data-testid="contact-first" /></Field>
      <Field label="Nachname *"><input name="lastName" defaultValue={c?.lastName} className="input" required data-testid="contact-last" /></Field>
      <Field label="Position"><input name="title" defaultValue={c?.title ?? ""} className="input" data-testid="contact-title" /></Field>
      <Field label="Rolle">
        <select name="roleCategory" defaultValue={c?.roleCategory ?? ""} className="input">
          <option value="">automatisch aus Position</option>
          {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Field>
      <Field label="E-Mail"><input name="email" type="email" defaultValue={c?.email ?? ""} className="input" /></Field>
      <Field label="Telefon"><input name="phone" defaultValue={c?.phone ?? ""} className="input" /></Field>
      <Field label="LinkedIn-Profil-URL"><input name="linkedinUrl" defaultValue={c?.linkedinUrl ?? ""} className="input" data-testid="contact-linkedin" /></Field>
      <Field label="Sales-Navigator-Lead-URL"><input name="salesNavUrl" defaultValue={c?.salesNavUrl ?? ""} className="input" /></Field>
      <Field label="Notizen"><input name="notes" defaultValue={c?.notes ?? ""} className="input" /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPrimary" defaultChecked={c?.isPrimary} /> Hauptansprechpartner</label>
    </div>
  );
}

export default async function ContactsTab({ companyId }: TabProps) {
  const contacts = await db.contact.findMany({ where: { companyId }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] });
  return (
    <div className="space-y-6">
      <Section title="Ansprechpartner">
        {contacts.length === 0 && <Empty>Noch keine Ansprechpartner.</Empty>}
        <div className="space-y-3">
          {contacts.map((c) => (
            <details key={c.id} className="rounded-md border border-ink-200">
              <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3 text-sm">
                <span className="font-medium">{c.firstName} {c.lastName}</span>
                <span className="text-ink-500">{c.title}</span>
                <Badge>{roleLabels[c.roleCategory ?? "OTHER"]}</Badge>
                {c.isPrimary && <Badge tone="blue">Hauptkontakt</Badge>}
                <Badge tone={c.outreachStatus === "REPLIED" ? "green" : c.outreachStatus === "SENT" ? "blue" : "gray"}>Outreach: {c.outreachStatus}</Badge>
                <span className="ml-auto flex gap-3">{c.phone && <a href={`/calls/${c.id}`} className="link text-xs">Anrufen mit Leitfaden</a>}{c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="link text-xs">LinkedIn ↗</a>}</span>
              </summary>
              <div className="border-t border-ink-100 p-4">
                <form action={saveContactAction.bind(null, companyId, c.id)} className="space-y-3">
                  <ContactFields c={c} />
                  <div className="flex gap-2">
                    <SubmitButton className="btn-secondary">Speichern</SubmitButton>
                  </div>
                </form>
                <form action={deleteContactAction.bind(null, companyId, c.id)} className="mt-2">
                  <SubmitButton className="btn-danger btn-sm" confirm="Kontakt löschen?">Löschen</SubmitButton>
                </form>
              </div>
            </details>
          ))}
        </div>
      </Section>
      <Section title="Ansprechpartner hinzufügen">
        <form action={saveContactAction.bind(null, companyId, null)} className="space-y-3">
          <ContactFields />
          <SubmitButton data-testid="save-contact">Hinzufügen</SubmitButton>
        </form>
        <p className="mt-3 text-xs text-ink-400">Relevante Rollen: Geschäftsführer, Inhaber, CEO, Vertriebsleiter, Head of Sales, CCO, Business Development Director, COO, Digital Transformation Manager.</p>
      </Section>
    </div>
  );
}
