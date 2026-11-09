import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Empty, Badge } from "@/components/ui";
import { date } from "@/lib/format";

export const metadata = { title: "Potenzialanalysen" };

export default async function AnalysesPage() {
  const user = await requireUser();
  const companies = await db.company.findMany({
    where: { tenantId: user.tenantId, OR: [{ findings: { some: {} } }, { solutions: { some: {} } }, { analyses: { some: {} } }, { meetings: { some: {} } }] },
    include: {
      findings: { select: { status: true } },
      solutions: { select: { status: true } },
      analyses: { select: { id: true, updatedAt: true } },
      meetings: { select: { status: true, endedAt: true }, orderBy: { createdAt: "desc" } },
      stage: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div>
      <PageHeader title="Potenzialanalysen" subtitle="Gemeinsam dokumentierte Probleme, Lösungsansätze und Wirtschaftlichkeitsbewertungen je Unternehmen." />
      {companies.length === 0 ? <Empty>Noch keine Analysen. Starten Sie mit einem Gespräch oder dokumentieren Sie Erkenntnisse in der Unternehmensakte.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Unternehmen</th><th>Phase</th><th>Erkenntnisse</th><th>Lösungen</th><th>Wirtschaftlichkeit</th><th>Gespräche</th></tr></thead>
            <tbody>
              {companies.map((c) => {
                const confirmed = c.findings.filter((f) => f.status === "CONFIRMED").length;
                const lastMeeting = c.meetings.find((m) => m.endedAt);
                return (
                  <tr key={c.id}>
                    <td><Link className="link" href={`/companies/${c.id}?tab=analysis`}>{c.name}</Link></td>
                    <td>{c.stage ? <span className="text-xs">{c.stage.name}</span> : "–"}</td>
                    <td>{c.findings.length} <span className="text-xs text-ink-500">({confirmed} bestätigt)</span></td>
                    <td>{c.solutions.filter((s) => s.status === "SELECTED").length} ausgewählt / {c.solutions.length}</td>
                    <td>{c.analyses.length ? <Badge tone="green">{c.analyses.length} · {date(c.analyses[0].updatedAt)}</Badge> : <Badge>keine</Badge>}</td>
                    <td>{c.meetings.length}{lastMeeting && <span className="text-xs text-ink-500"> · zuletzt {date(lastMeeting.endedAt)}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
