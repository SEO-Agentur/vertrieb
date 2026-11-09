import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { PageHeader, Section, ScoreBadge, Empty, Badge, InfoStatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { millions } from "@/lib/format";
import { setQualificationAction } from "../companies/actions";

export const metadata = { title: "Qualifizierung" };

export default async function QualificationPage() {
  const user = await requireUser();
  const [queue, revenueReview, scoring] = await Promise.all([
    db.company.findMany({ where: { tenantId: user.tenantId, qualificationStatus: { in: ["NEW", "IN_PROGRESS"] } }, orderBy: { score: { sort: "desc", nulls: "last" } }, include: { _count: { select: { contacts: true } } } }),
    db.company.findMany({ where: { tenantId: user.tenantId, qualificationStatus: "REVENUE_REVIEW" }, orderBy: { createdAt: "asc" } }),
    getSetting(user.tenantId, "scoring"),
  ]);
  const Row = ({ c }: { c: (typeof queue)[number] | (typeof revenueReview)[number] }) => (
    <tr>
      <td><Link className="font-medium hover:underline" href={`/companies/${c.id}?tab=qualification`}>{c.name}</Link><div className="text-xs text-ink-400">{c.industry ?? "Branche unbekannt"} · {c.location ?? "–"}</div></td>
      <td className="whitespace-nowrap">{millions(c.revenueEur)} <InfoStatusBadge status={c.revenueStatus} /></td>
      <td><ScoreBadge score={c.score} /> {c.score != null && c.score >= scoring.thresholds.qualified && <Badge tone="green">≥ Schwelle</Badge>}</td>
      <td className="text-right">
        <form action={setQualificationAction.bind(null, c.id)} className="inline-flex gap-1">
          {c.revenueEur != null && <SubmitButton name="status" value="QUALIFIED" className="btn-secondary btn-sm">Qualifizieren</SubmitButton>}
          <SubmitButton name="status" value="IN_PROGRESS" className="btn-ghost btn-sm">In Prüfung</SubmitButton>
          <SubmitButton name="status" value="DISQUALIFIED" className="btn-ghost btn-sm">Passt nicht</SubmitButton>
        </form>
      </td>
    </tr>
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Qualifizierung" subtitle={`Schwellenwert „qualifizierbar“: ${scoring.thresholds.qualified} · „Top-Priorität“: ${scoring.thresholds.hot}`} />
      <Section title={`Warteschlange (${queue.length})`}>
        {queue.length === 0 ? <Empty>Keine offenen Unternehmen.</Empty> : <table className="table"><thead><tr><th>Unternehmen</th><th>Umsatz</th><th>Score</th><th /></tr></thead><tbody>{queue.map((c) => <Row key={c.id} c={c} />)}</tbody></table>}
      </Section>
      <Section title={`Prüfwarteschlange: Umsatz unbekannt (${revenueReview.length})`}>
        <p className="mb-3 text-xs text-ink-500">Diese Unternehmen werden nicht qualifiziert, bevor ein Umsatz mit Quelle (oder als gekennzeichnete Schätzung) erfasst ist.</p>
        {revenueReview.length === 0 ? <Empty>Keine Einträge.</Empty> : <table className="table"><thead><tr><th>Unternehmen</th><th>Umsatz</th><th>Score</th><th /></tr></thead><tbody>{revenueReview.map((c) => <Row key={c.id} c={c} />)}</tbody></table>}
      </Section>
    </div>
  );
}
