import type { TabProps } from "./types";
import { db } from "@/lib/db";
import { Section, Badge, NotActivated, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { seoStatus, type SeoScanData } from "@/lib/seo";
import { dateTime } from "@/lib/format";
import { importSeoScan, runSeoScan, updateSeoScan, suggestSeoSolutions } from "@/app/(app)/seo/actions";

const SEV: Record<string, "red" | "amber" | "gray"> = { high: "red", medium: "amber", low: "gray" };

export default async function SeoTab({ companyId }: TabProps) {
  const [company, scans] = await Promise.all([
    db.company.findUniqueOrThrow({ where: { id: companyId }, select: { website: true } }),
    db.seoScan.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } }),
  ]);
  const st = seoStatus();
  return (
    <div className="space-y-6">
      <Section title="SEO-Scanner (guaranteedseoservices.com)">
        <p className="mb-3 text-sm text-ink-600">Der bestehende SEO-Scanner wird nicht nachgebaut, sondern optional angebunden. Ob eine API oder ein Datenexport verfügbar ist, ist noch nicht verifiziert – bis dahin werden Scan-Ergebnisse manuell importiert.</p>
        {st.enabled ? (
          <form action={runSeoScan} className="mb-4 flex gap-2">
            <input type="hidden" name="companyId" value={companyId} />
            <input name="url" defaultValue={company.website ?? ""} placeholder="https://…" className="input max-w-md" />
            <SubmitButton pendingText="Scanne …">Scan auslösen</SubmitButton>
          </form>
        ) : <div className="mb-4"><NotActivated name="SEO-Scanner-API" detail={st.reason} /></div>}
        <form action={importSeoScan} className="space-y-2">
          <input type="hidden" name="companyId" value={companyId} />
          <label className="block"><span className="label">Website</span><input name="url" defaultValue={company.website ?? ""} className="input max-w-md" /></label>
          <label className="block"><span className="label">Manueller Import (JSON oder CSV: Titel;Schwere(high/medium/low);Kategorie;Empfehlung)</span>
            <textarea name="data" rows={5} className="input font-mono text-xs" placeholder={'{"url":"https://…","score":62,"summary":"…","issues":[{"title":"Fehlende Meta-Beschreibungen","severity":"medium"}]}'} />
          </label>
          <SubmitButton className="btn-secondary">Importieren</SubmitButton>
        </form>
      </Section>
      <Section title="Scan-Ergebnisse" actions={scans.length > 0 && (
        <form action={suggestSeoSolutions}><input type="hidden" name="companyId" value={companyId} /><SubmitButton className="btn-secondary btn-sm">SEO-Lösungen vorschlagen</SubmitButton></form>
      )}>
        {scans.length === 0 ? <Empty>Noch keine Scans.</Empty> : scans.map((s) => {
          const issues = (s.issues ?? []) as SeoScanData["issues"];
          return (
            <div key={s.id} className="mb-4 rounded-md border border-ink-200 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-medium">{s.url || "–"}</span>
                {s.score != null && <Badge tone={s.score >= 80 ? "green" : s.score >= 50 ? "amber" : "red"}>Score {s.score}</Badge>}
                <Badge>{s.source === "API" ? "API" : "manueller Import"}</Badge>
                <span className="text-xs text-ink-500">{dateTime(s.scannedAt ?? s.createdAt)}</span>
                {s.shareWithClient && <Badge tone="green">in Kundenwelt</Badge>}
                <form action={updateSeoScan} className="ml-auto flex gap-1">
                  <input type="hidden" name="id" value={s.id} />
                  <button name="action" value="share" className="btn-secondary btn-sm">{s.shareWithClient ? "Freigabe entziehen" : "In Kundenwelt freigeben"}</button>
                  <button name="action" value="delete" className="btn-danger btn-sm">Löschen</button>
                </form>
              </div>
              {s.summary && <p className="mb-2 text-sm text-ink-600">{s.summary}</p>}
              <ul className="space-y-1 text-sm">
                {issues.map((i, k) => <li key={k}><Badge tone={SEV[i.severity] ?? "gray"}>{i.severity}</Badge> {i.title}{i.category && <span className="text-xs text-ink-400"> · {i.category}</span>}{i.recommendation && <div className="ml-14 text-xs text-ink-500">{i.recommendation}</div>}</li>)}
              </ul>
            </div>
          );
        })}
      </Section>
    </div>
  );
}
