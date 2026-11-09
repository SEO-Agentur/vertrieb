import type { TabProps } from "./types";
import { db } from "@/lib/db";
import { Field, Section, Empty, NotActivated } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { aiStatus } from "@/lib/ai/provider";
import { generateMessageAction } from "@/app/(app)/outreach/actions";
import { MessageCard } from "@/app/(app)/outreach/MessageCard";

export default async function OutreachTab({ companyId, user }: TabProps) {
  const [contacts, messages, room] = await Promise.all([
    db.contact.findMany({ where: { companyId }, orderBy: [{ isPrimary: "desc" }, { lastName: "asc" }] }),
    db.outreachMessage.findMany({ where: { companyId }, include: { contact: true }, orderBy: { createdAt: "desc" } }),
    db.room.findUnique({ where: { companyId }, select: { status: true } }),
  ]);
  const ai = aiStatus();
  const editor = user.role !== "VIEWER";
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-ink-200 bg-white px-4 py-3 text-xs text-ink-600">
        Nachrichten werden hier vorbereitet und müssen von Ihnen freigegeben werden. Der Versand erfolgt <strong>manuell</strong> auf LinkedIn (kopieren → Profil öffnen → senden) und wird anschließend hier dokumentiert. Es gibt keine automatisierte LinkedIn-Nachrichtenversendung.
      </div>
      {editor && (
        <Section title="Neue Nachricht vorbereiten">
          {contacts.length === 0 ? <Empty>Bitte zuerst einen Ansprechpartner anlegen (Tab „Ansprechpartner“).</Empty> : (
            <form action={generateMessageAction.bind(null, companyId)} className="grid items-end gap-3 md:grid-cols-5">
              <Field label="Ansprechpartner">
                <select name="contactId" className="input" required data-testid="outreach-contact">
                  {contacts.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.title ? ` – ${c.title}` : ""}</option>)}
                </select>
              </Field>
              <Field label="Art">
                <select name="kind" className="input"><option value="INITIAL">Erstansprache</option><option value="FOLLOW_UP">Follow-up</option><option value="CONNECT">Kontaktanfrage (max. 300 Zeichen)</option></select>
              </Field>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input type="checkbox" name="withInvite" defaultChecked={Boolean(room)} disabled={!room} data-testid="outreach-with-invite" /> Neuen Einladungslink einfügen
              </label>
              <Field label="Link gültig (Tage)"><input name="days" type="number" min={1} max={365} defaultValue={30} className="input" /></Field>
              <SubmitButton pendingText="Erzeuge …"><span data-testid="generate-message">Nachricht erzeugen</span></SubmitButton>
              {!room && <p className="text-xs text-amber-700 md:col-span-5">Ohne Kundenwelt kann kein Einladungslink eingefügt werden.</p>}
              {room && room.status !== "PUBLISHED" && <p className="text-xs text-amber-700 md:col-span-5">Hinweis: Die Kundenwelt ist noch nicht veröffentlicht – Einladungslinks funktionieren erst nach Veröffentlichung.</p>}
            </form>
          )}
          <div className="mt-3">{!ai.enabled && <NotActivated name="KI-Überarbeitung" detail={`${ai.reason} Nachrichten werden aus Vorlagen erzeugt.`} />}</div>
        </Section>
      )}
      <Section title={`Nachrichten (${messages.length})`}>
        {messages.length === 0 ? <Empty>Noch keine Nachrichten.</Empty> : (
          <div className="space-y-4">
            {messages.map((m) => (
              <MessageCard
                key={m.id}
                aiEnabled={ai.enabled}
                editor={editor}
                m={{ id: m.id, body: m.body, status: m.status, kind: m.kind, origin: m.origin, sentAt: m.sentAt?.toISOString() ?? null, followUpAt: m.followUpAt?.toISOString() ?? null, contactName: m.contact ? `${m.contact.firstName} ${m.contact.lastName}` : null, linkedinUrl: m.contact?.linkedinUrl ?? null, inviteUrlIncluded: m.inviteUrlIncluded }}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
