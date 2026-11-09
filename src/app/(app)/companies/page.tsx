import Link from "next/link";
import type { Prisma, QualificationStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, PageHeader, ScoreBadge, Empty, InfoStatusBadge } from "@/components/ui";
import { millions, qualificationLabel, relative } from "@/lib/format";

export const metadata = { title: "Unternehmen" };

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; stage?: string; industry?: string; sort?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const where: Prisma.CompanyWhereInput = { tenantId: user.tenantId };
  if (sp.q) where.OR = [{ name: { contains: sp.q, mode: "insensitive" } }, { location: { contains: sp.q, mode: "insensitive" } }, { domain: { contains: sp.q, mode: "insensitive" } }];
  if (sp.status) where.qualificationStatus = sp.status as QualificationStatus;
  if (sp.stage) where.stageId = sp.stage;
  if (sp.industry) where.industry = { contains: sp.industry, mode: "insensitive" };
  const orderBy: Prisma.CompanyOrderByWithRelationInput = sp.sort === "name" ? { name: "asc" } : sp.sort === "revenue" ? { revenueEur: { sort: "desc", nulls: "last" } } : sp.sort === "recent" ? { updatedAt: "desc" } : { score: { sort: "desc", nulls: "last" } };
  const [companies, stages] = await Promise.all([
    db.company.findMany({ where, orderBy, take: 300, include: { stage: true, _count: { select: { contacts: true } }, room: { select: { status: true } } } }),
    db.pipelineStage.findMany({ where: { tenantId: user.tenantId }, orderBy: { order: "asc" } }),
  ]);
  return (
    <div>
      <PageHeader title="Unternehmen" subtitle={`${companies.length} Einträge`} actions={<><Link href="/prospecting" className="btn-secondary">Importieren</Link><Link href="/companies/new" className="btn-primary" data-testid="new-company">Unternehmen anlegen</Link></>} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Suche: Name, Ort, Domain" className="input w-64" />
        <input name="industry" defaultValue={sp.industry} placeholder="Branche" className="input w-44" />
        <select name="status" defaultValue={sp.status ?? ""} className="input w-44">
          <option value="">Alle Status</option>
          {Object.entries(qualificationLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="stage" defaultValue={sp.stage ?? ""} className="input w-56">
          <option value="">Alle Phasen</option>
          {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select name="sort" defaultValue={sp.sort ?? "score"} className="input w-40">
          <option value="score">Score</option><option value="revenue">Umsatz</option><option value="name">Name</option><option value="recent">Zuletzt geändert</option>
        </select>
        <button className="btn-secondary">Filtern</button>
      </form>
      {companies.length === 0 ? <Empty>Noch keine Unternehmen. Legen Sie eines an oder importieren Sie eine CSV-Datei.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Unternehmen</th><th>Branche</th><th>Umsatz</th><th>Score</th><th>Qualifizierung</th><th>Phase</th><th>Kontakte</th><th>Kundenwelt</th><th>Geändert</th></tr></thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-ink-50">
                  <td><Link href={`/companies/${c.id}`} className="font-medium hover:underline">{c.name}</Link><div className="text-xs text-ink-400">{c.location}</div></td>
                  <td className="text-ink-600">{c.industry ?? "–"}</td>
                  <td className="whitespace-nowrap">{millions(c.revenueEur)} <InfoStatusBadge status={c.revenueStatus} /></td>
                  <td><ScoreBadge score={c.score} /></td>
                  <td><Badge tone={c.qualificationStatus === "QUALIFIED" ? "green" : c.qualificationStatus === "REVENUE_REVIEW" ? "amber" : c.qualificationStatus === "DISQUALIFIED" ? "red" : "gray"}>{qualificationLabel[c.qualificationStatus]}</Badge></td>
                  <td>{c.stage && <span className="whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] text-white" style={{ background: c.stage.color }}>{c.stage.name}</span>}</td>
                  <td className="text-center">{c._count.contacts}</td>
                  <td>{c.room ? <Badge tone={c.room.status === "PUBLISHED" ? "green" : "gray"}>{c.room.status === "PUBLISHED" ? "veröffentlicht" : c.room.status === "DRAFT" ? "Entwurf" : "archiviert"}</Badge> : "–"}</td>
                  <td className="whitespace-nowrap text-xs text-ink-400">{relative(c.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
