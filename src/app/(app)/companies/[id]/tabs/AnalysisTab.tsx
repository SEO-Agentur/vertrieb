import Link from "next/link";
import type { TabProps } from "./types";
import { db } from "@/lib/db";
import { Section, Badge, InfoStatusBadge, Empty } from "@/components/ui";
import { FindingForm } from "@/components/analysis/FindingForm";
import { EconomicsEditor } from "@/components/analysis/EconomicsEditor";
import { updateFinding, suggestSolution, updateCompanySolution, updateAnalysis } from "@/app/(app)/analyses/actions";
import { DEFAULT_CALCULATOR, sanitizeInputs, type CalculatorInputs } from "@/lib/calculator";
import { SubmitButton } from "@/components/SubmitButton";

export default async function AnalysisTab({ companyId, user }: TabProps) {
  const [company, findings, solutions, analyses, catalogSolutions, room] = await Promise.all([
    db.company.findUniqueOrThrow({ where: { id: companyId } }),
    db.finding.findMany({ where: { companyId }, include: { problem: true }, orderBy: { createdAt: "asc" } }),
    db.companySolution.findMany({ where: { companyId }, include: { solution: { include: { services: { include: { service: true } } } } }, orderBy: { createdAt: "asc" } }),
    db.economicAnalysis.findMany({ where: { companyId }, orderBy: { createdAt: "asc" } }),
    db.solution.findMany({ where: { tenantId: user.tenantId, active: true }, include: { problems: true }, orderBy: { name: "asc" } }),
    db.room.findUnique({ where: { companyId }, select: { calculator: true } }),
  ]);
  const problemIds = new Set(findings.filter((f) => f.status !== "REJECTED" && f.problemId).map((f) => f.problemId!));
  const linked = new Set(solutions.map((s) => s.solutionId));
  const suggested = catalogSolutions.filter((s) => !linked.has(s.id) && s.problems.some((p) => problemIds.has(p.problemId)));
  const others = catalogSolutions.filter((s) => !linked.has(s.id) && !suggested.includes(s));
  const roomCalc = room ? sanitizeInputs(room.calculator as Partial<CalculatorInputs>) : null;
  const defaults: CalculatorInputs = { ...DEFAULT_CALCULATOR, ...(roomCalc ?? {}), revenueEur: roomCalc?.revenueEur || company.revenueEur || 0, revenueIsVerified: company.revenueStatus === "VERIFIED" };

  return (
    <div className="space-y-6">
      <Section title="Gemeinsam dokumentierte Probleme & Erkenntnisse">
        {findings.length === 0 ? <Empty>Noch keine Erkenntnisse dokumentiert.</Empty> : (
          <ul className="mb-6 divide-y divide-ink-100" data-testid="findings-list">
            {findings.map((f) => (
              <li key={f.id} className="flex flex-wrap items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{f.title}</span>
                    <InfoStatusBadge status={f.status} />
                    <Badge>{f.area}</Badge>
                    {f.problem && <Badge tone="blue">{f.problem.name}</Badge>}
                    {f.origin === "AI" && <Badge tone="violet">KI-Vorschlag</Badge>}
                    {f.shareWithClient && <Badge tone="green">in Kundenwelt</Badge>}
                  </div>
                  {f.description && <p className="mt-1 text-sm text-ink-600">{f.description}</p>}
                  {(f.cause || f.impact) && <p className="mt-1 text-xs text-ink-500">{f.cause && <>Ursache: {f.cause} </>}{f.impact && <>· Auswirkung: {f.impact}</>}</p>}
                </div>
                <form action={updateFinding} className="flex flex-wrap gap-1">
                  <input type="hidden" name="id" value={f.id} />
                  {f.status !== "CONFIRMED" && <SubmitButton name="action" value="confirm" className="btn-secondary btn-sm">Bestätigt</SubmitButton>}
                  {f.status !== "REJECTED" && <SubmitButton name="action" value="reject" className="btn-secondary btn-sm">Verwerfen</SubmitButton>}
                  <SubmitButton name="action" value="share" className="btn-secondary btn-sm">{f.shareWithClient ? "Freigabe entziehen" : "Freigeben"}</SubmitButton>
                  <SubmitButton name="action" value="delete" className="btn-danger btn-sm">Löschen</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
        <details open={findings.length === 0}>
          <summary className="cursor-pointer text-sm font-medium">Neue Erkenntnis dokumentieren</summary>
          <div className="mt-3"><FindingForm tenantId={user.tenantId} companyId={companyId} /></div>
        </details>
      </Section>

      <Section title="Lösungsansätze">
        {suggested.length > 0 && (
          <div className="mb-4 rounded-md bg-sky-50 p-3">
            <div className="mb-2 text-xs font-semibold text-sky-800">Passend zu den dokumentierten Problemen (aus dem Katalog):</div>
            <div className="flex flex-wrap gap-2">
              {suggested.map((s) => (
                <form key={s.id} action={suggestSolution}>
                  <input type="hidden" name="companyId" value={companyId} />
                  <input type="hidden" name="solutionId" value={s.id} />
                  {findings.filter((f) => f.problemId && s.problems.some((p) => p.problemId === f.problemId)).map((f) => <input key={f.id} type="hidden" name="findingIds" value={f.id} />)}
                  <button className="btn-secondary btn-sm" data-testid="suggest-solution">+ {s.name}</button>
                </form>
              ))}
            </div>
          </div>
        )}
        {solutions.length === 0 ? <Empty>Noch keine Lösungen vorgeschlagen.</Empty> : (
          <ul className="divide-y divide-ink-100">
            {solutions.map((cs) => (
              <li key={cs.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{cs.solution.name}</span>
                  <Badge tone={cs.status === "SELECTED" ? "green" : cs.status === "REJECTED" ? "red" : "amber"}>{cs.status === "SELECTED" ? "ausgewählt" : cs.status === "REJECTED" ? "verworfen" : "vorgeschlagen"}</Badge>
                  {cs.shareWithClient && <Badge tone="green">in Kundenwelt</Badge>}
                  <form action={updateCompanySolution} className="ml-auto flex flex-wrap gap-1">
                    <input type="hidden" name="id" value={cs.id} />
                    {cs.status !== "SELECTED" && <SubmitButton name="action" value="select" className="btn-primary btn-sm" data-testid="select-solution">Auswählen</SubmitButton>}
                    {cs.status !== "REJECTED" && <SubmitButton name="action" value="reject" className="btn-secondary btn-sm">Verwerfen</SubmitButton>}
                    <SubmitButton name="action" value="share" className="btn-secondary btn-sm">{cs.shareWithClient ? "Freigabe entziehen" : "Freigeben"}</SubmitButton>
                    <SubmitButton name="action" value="delete" className="btn-danger btn-sm">Entfernen</SubmitButton>
                  </form>
                </div>
                {cs.solution.description && <p className="mt-1 text-sm text-ink-600">{cs.solution.description}</p>}
                <p className="mt-1 text-xs text-ink-500">Leistungen: {cs.solution.services.map((s) => s.service.name).join(", ") || "–"}</p>
                <form action={updateCompanySolution} className="mt-2 flex gap-2">
                  <input type="hidden" name="id" value={cs.id} />
                  <input type="hidden" name="action" value="note" />
                  <input name="note" defaultValue={cs.note ?? ""} placeholder="Notiz / Anpassung für diesen Kunden" className="input" />
                  <SubmitButton className="btn-secondary btn-sm">Speichern</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
        {others.length > 0 && (
          <form action={suggestSolution} className="mt-4 flex gap-2">
            <input type="hidden" name="companyId" value={companyId} />
            <select name="solutionId" className="input max-w-sm">{others.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <SubmitButton className="btn-secondary">Weitere Lösung hinzufügen</SubmitButton>
          </form>
        )}
        <div className="mt-4 text-sm">
          <Link className="link" href={`/companies/${companyId}?tab=offers`}>→ Zum Angebotskonfigurator</Link>
        </div>
      </Section>

      <Section title="Wirtschaftlichkeitsanalysen">
        <div className="space-y-6">
          {analyses.map((a) => (
            <details key={a.id} className="rounded-md border border-ink-200 p-4">
              <summary className="flex cursor-pointer flex-wrap items-center gap-2">
                <span className="font-medium">{a.name}</span>
                {a.shareWithClient && <Badge tone="green">in Kundenwelt</Badge>}
                <form action={updateAnalysis} className="ml-auto flex gap-1">
                  <input type="hidden" name="id" value={a.id} />
                  <SubmitButton name="action" value="share" className="btn-secondary btn-sm">{a.shareWithClient ? "Freigabe entziehen" : "Freigeben"}</SubmitButton>
                  <SubmitButton name="action" value="delete" className="btn-danger btn-sm">Löschen</SubmitButton>
                </form>
              </summary>
              <div className="mt-4">
                <EconomicsEditor companyId={companyId} defaults={defaults} analysis={{ id: a.id, name: a.name, inputs: sanitizeInputs(a.inputs as Partial<CalculatorInputs>), assumptions: a.assumptions, shareWithClient: a.shareWithClient }} />
              </div>
            </details>
          ))}
          <div>
            <div className="mb-3 text-sm font-medium">Neue Analyse</div>
            <EconomicsEditor companyId={companyId} defaults={defaults} />
          </div>
        </div>
      </Section>
    </div>
  );
}
