import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, ScoreBadge } from "@/components/ui";
import { eur, relative } from "@/lib/format";
import { Kanban } from "./Kanban";

export const metadata = { title: "Sales-Pipeline" };

export default async function PipelinePage({ searchParams }: { searchParams: Promise<{ view?: string; q?: string }> }) {
  const user = await requireUser();
  const { view = "kanban", q } = await searchParams;
  const [stages, companies] = await Promise.all([
    db.pipelineStage.findMany({ where: { tenantId: user.tenantId }, orderBy: { order: "asc" } }),
    db.company.findMany({ where: { tenantId: user.tenantId, ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) }, orderBy: { score: { sort: "desc", nulls: "last" } }, include: { stage: true } }),
  ]);
  return (
    <div>
      <PageHeader title="Sales-Pipeline" subtitle="Phasen konfigurierbar unter Einstellungen → Pipeline." actions={
        <div className="flex gap-2">
          <form><input name="q" defaultValue={q} placeholder="Suche" className="input w-48" /><input type="hidden" name="view" value={view} /></form>
          <Link href={`/pipeline?view=kanban${q ? `&q=${q}` : ""}`} className={view === "kanban" ? "btn-primary" : "btn-secondary"}>Kanban</Link>
          <Link href={`/pipeline?view=table${q ? `&q=${q}` : ""}`} className={view === "table" ? "btn-primary" : "btn-secondary"}>Tabelle</Link>
        </div>
      } />
      {view === "kanban" ? (
        <Kanban stages={stages.map((s) => ({ id: s.id, name: s.name, color: s.color }))} cards={companies.map((c) => ({ id: c.id, name: c.name, score: c.score, dealValue: c.dealValue, stageId: c.stageId, industry: c.industry }))} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Unternehmen</th><th>Phase</th><th>Seit</th><th>Score</th><th>Auftragswert</th><th>Wahrscheinlichkeit</th></tr></thead>
            <tbody>{companies.map((c) => (
              <tr key={c.id}>
                <td><Link className="font-medium hover:underline" href={`/companies/${c.id}`}>{c.name}</Link></td>
                <td>{c.stage && <span className="rounded px-1.5 py-0.5 text-[11px] text-white" style={{ background: c.stage.color }}>{c.stage.name}</span>}</td>
                <td className="text-xs text-ink-500">{relative(c.stageSince)}</td>
                <td><ScoreBadge score={c.score} /></td>
                <td>{eur(c.dealValue)}</td>
                <td>{c.stage?.probability ?? 0} %</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
