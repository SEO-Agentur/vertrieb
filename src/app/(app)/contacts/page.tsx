import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Badge, Empty } from "@/components/ui";
import { roleLabels } from "@/lib/normalize";

export const metadata = { title: "Ansprechpartner" };

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; outreach?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const where: Prisma.ContactWhereInput = { tenantId: user.tenantId };
  if (sp.q) where.OR = [{ firstName: { contains: sp.q, mode: "insensitive" } }, { lastName: { contains: sp.q, mode: "insensitive" } }, { company: { name: { contains: sp.q, mode: "insensitive" } } }];
  if (sp.role) where.roleCategory = sp.role;
  if (sp.outreach) where.outreachStatus = sp.outreach;
  const contacts = await db.contact.findMany({ where, include: { company: { select: { id: true, name: true, qualificationStatus: true } } }, orderBy: { createdAt: "desc" }, take: 500 });
  return (
    <div>
      <PageHeader title="Ansprechpartner" subtitle={`${contacts.length} Kontakte`} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Name oder Unternehmen" className="input w-64" />
        <select name="role" defaultValue={sp.role ?? ""} className="input w-56"><option value="">Alle Rollen</option>{Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select name="outreach" defaultValue={sp.outreach ?? ""} className="input w-48"><option value="">Alle Outreach-Status</option>{["NONE", "PREPARED", "SENT", "REPLIED", "NO_RESPONSE"].map((s) => <option key={s}>{s}</option>)}</select>
        <button className="btn-secondary">Filtern</button>
      </form>
      {contacts.length === 0 ? <Empty>Keine Kontakte gefunden.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Name</th><th>Position</th><th>Rolle</th><th>Unternehmen</th><th>Outreach</th><th>LinkedIn</th></tr></thead>
            <tbody>{contacts.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.firstName} {c.lastName}{c.isPrimary && <Badge tone="blue">Haupt</Badge>}</td>
                <td>{c.title}</td>
                <td><Badge>{roleLabels[c.roleCategory ?? "OTHER"]}</Badge></td>
                <td><Link className="hover:underline" href={`/companies/${c.company.id}?tab=contacts`}>{c.company.name}</Link></td>
                <td><Badge tone={c.outreachStatus === "REPLIED" ? "green" : c.outreachStatus === "SENT" ? "blue" : "gray"}>{c.outreachStatus}</Badge></td>
                <td>{c.linkedinUrl ? <a className="link text-xs" href={c.linkedinUrl} target="_blank" rel="noopener noreferrer">Profil ↗</a> : "–"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
