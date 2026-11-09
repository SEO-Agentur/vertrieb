import { db } from "@/lib/db";
import { addFinding } from "@/app/(app)/analyses/actions";
import { SubmitButton } from "@/components/SubmitButton";

/** Formular "Erkenntnis dokumentieren" – genutzt in Potenzialanalyse und Gesprächs-Workspace. */
export async function FindingForm({ tenantId, companyId, meetingId }: { tenantId: string; companyId: string; meetingId?: string }) {
  const categories = await db.problemCategory.findMany({ where: { tenantId }, orderBy: { order: "asc" }, include: { problems: { where: { active: true }, orderBy: { name: "asc" } } } });
  return (
    <form action={addFinding} className="grid gap-3 md:grid-cols-2">
      <input type="hidden" name="companyId" value={companyId} />
      {meetingId && <input type="hidden" name="meetingId" value={meetingId} />}
      <label><span className="label">Bereich</span>
        <select name="area" className="input" data-testid="finding-area">
          {categories.map((c) => <option key={c.id} value={c.key}>{c.name}</option>)}
          <option value="ALLGEMEIN">Allgemein</option>
        </select>
      </label>
      <label><span className="label">Problem aus Katalog (optional)</span>
        <select name="problemId" className="input" data-testid="finding-problem">
          <option value="">– kein Katalogeintrag –</option>
          {categories.map((c) => (
            <optgroup key={c.id} label={c.name}>
              {c.problems.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="md:col-span-2"><span className="label">Titel</span><input name="title" required className="input" data-testid="finding-title" placeholder="z.B. Angebotserstellung dauert im Schnitt 3 Tage" /></label>
      <label className="md:col-span-2"><span className="label">Beschreibung</span><textarea name="description" rows={2} className="input" /></label>
      <label><span className="label">Mögliche Ursache</span><input name="cause" className="input" /></label>
      <label><span className="label">Auswirkung</span><input name="impact" className="input" /></label>
      <label><span className="label">Status</span>
        <select name="status" className="input" data-testid="finding-status">
          <option value="CONFIRMED">Vom Kunden bestätigt</option>
          <option value="HYPOTHESIS">Hypothese (unbestätigt)</option>
        </select>
      </label>
      <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" name="shareWithClient" /> In Kundenwelt freigeben</label>
      <div className="md:col-span-2"><SubmitButton pendingText="Speichere …" data-testid="add-finding">Erkenntnis speichern</SubmitButton></div>
    </form>
  );
}
