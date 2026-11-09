import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Badge, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { eur } from "@/lib/format";
import { OFFER_SECTIONS, PRICING_LABEL, type OfferSections } from "@/lib/offers";
import * as A from "./actions";

export const metadata = { title: "Lösungskatalog" };

const TABS = [["problems", "Probleme"], ["solutions", "Lösungen"], ["services", "Dienstleistungen"], ["packages", "Leistungspakete"], ["templates", "Angebotsvorlagen"]] as const;
const PRICING = Object.entries(PRICING_LABEL);

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser();
  const { tab = "problems" } = await searchParams;
  const tenantId = user.tenantId;
  return (
    <div>
      <PageHeader title="Problem- und Lösungskatalog" subtitle="Vollständig administrierbar: Kategorien, Probleme, Lösungsansätze, Dienstleistungen, Pakete und Angebotsvorlagen." />
      <nav className="mb-5 flex gap-1 border-b border-ink-200">
        {TABS.map(([k, l]) => <Link key={k} href={`/catalog?tab=${k}`} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === k ? "border-ink-900 font-medium" : "border-transparent text-ink-500"}`}>{l}</Link>)}
      </nav>
      {tab === "problems" && <Problems tenantId={tenantId} />}
      {tab === "solutions" && <Solutions tenantId={tenantId} />}
      {tab === "services" && <Services tenantId={tenantId} />}
      {tab === "packages" && <Packages tenantId={tenantId} />}
      {tab === "templates" && <Templates tenantId={tenantId} />}
    </div>
  );
}

async function Problems({ tenantId }: { tenantId: string }) {
  const cats = await db.problemCategory.findMany({ where: { tenantId }, orderBy: { order: "asc" }, include: { problems: { orderBy: { name: "asc" }, include: { _count: { select: { solutions: true, findings: true } } } } } });
  return (
    <div className="space-y-4">
      {cats.map((c) => (
        <section key={c.id} className="card">
          <details className="border-b border-ink-100 px-5 py-3">
            <summary className="flex cursor-pointer items-center gap-2"><span className="font-semibold">{c.name}</span><Badge>{c.key}</Badge><span className="text-xs text-ink-500">{(c.questions as string[]).length} Leitfragen</span></summary>
            <form action={A.saveCategory} className="mt-3 grid gap-2 md:grid-cols-3">
              <input type="hidden" name="id" value={c.id} />
              <label><span className="label">Name</span><input name="name" defaultValue={c.name} className="input" /></label>
              <label><span className="label">Reihenfolge</span><input name="order" type="number" defaultValue={c.order} className="input" /></label>
              <label><span className="label">Beschreibung</span><input name="description" defaultValue={c.description ?? ""} className="input" /></label>
              <label className="md:col-span-3"><span className="label">Leitfragen (eine pro Zeile)</span><textarea name="questions" rows={4} defaultValue={(c.questions as string[]).join("\n")} className="input" /></label>
              <div className="flex gap-2"><SubmitButton className="btn-primary btn-sm">Speichern</SubmitButton></div>
            </form>
            <form action={A.deleteCategory} className="mt-2"><input type="hidden" name="id" value={c.id} /><SubmitButton className="btn-danger btn-sm" confirm="Kategorie inkl. aller Probleme löschen?">Kategorie löschen</SubmitButton></form>
          </details>
          <ul className="divide-y divide-ink-100 px-5">
            {c.problems.map((p) => (
              <li key={p.id} className="py-2">
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm">
                    <span className={p.active ? "" : "text-ink-400 line-through"}>{p.name}</span>
                    <span className="text-xs text-ink-400">{p._count.solutions} Lösungen · {p._count.findings} Erkenntnisse</span>
                  </summary>
                  <form action={A.saveProblem} className="mt-2 grid gap-2 md:grid-cols-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="categoryId" value={c.id} />
                    <label><span className="label">Name</span><input name="name" defaultValue={p.name} className="input" /></label>
                    <label><span className="label">Indikatoren</span><input name="indicators" defaultValue={p.indicators ?? ""} className="input" /></label>
                    <label className="md:col-span-2"><span className="label">Beschreibung</span><textarea name="description" rows={2} defaultValue={p.description ?? ""} className="input" /></label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={p.active} /> aktiv</label>
                    <div className="flex gap-2"><SubmitButton className="btn-primary btn-sm">Speichern</SubmitButton></div>
                  </form>
                  <form action={A.deleteProblem} className="mt-1"><input type="hidden" name="id" value={p.id} /><SubmitButton className="btn-danger btn-sm" confirm="Problem löschen?">Löschen</SubmitButton></form>
                </details>
              </li>
            ))}
          </ul>
          <form action={A.saveProblem} className="flex flex-wrap gap-2 border-t border-ink-100 px-5 py-3">
            <input type="hidden" name="categoryId" value={c.id} />
            <input name="name" required placeholder="Neues Problem" className="input max-w-xs" />
            <input name="description" placeholder="Beschreibung" className="input max-w-md" />
            <SubmitButton className="btn-secondary btn-sm">Hinzufügen</SubmitButton>
          </form>
        </section>
      ))}
      <section className="card-pad">
        <div className="mb-2 text-sm font-semibold">Neue Problemkategorie</div>
        <form action={A.saveCategory} className="grid gap-2 md:grid-cols-3">
          <input name="name" required placeholder="Name" className="input" />
          <input name="key" placeholder="Schlüssel (optional, z.B. SERVICE)" className="input" />
          <input name="order" type="number" placeholder="Reihenfolge" className="input" />
          <textarea name="questions" rows={3} placeholder="Leitfragen, eine pro Zeile" className="input md:col-span-3" />
          <div><SubmitButton className="btn-primary btn-sm">Kategorie anlegen</SubmitButton></div>
        </form>
      </section>
    </div>
  );
}

async function Solutions({ tenantId }: { tenantId: string }) {
  const [solutions, cats, services] = await Promise.all([
    db.solution.findMany({ where: { tenantId }, orderBy: { name: "asc" }, include: { problems: true, services: true, _count: { select: { companies: true } } } }),
    db.problemCategory.findMany({ where: { tenantId }, orderBy: { order: "asc" }, include: { problems: { orderBy: { name: "asc" } } } }),
    db.service.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
  ]);
  const Form = ({ s }: { s?: (typeof solutions)[number] }) => (
    <form action={A.saveSolution} className="grid gap-3 md:grid-cols-2">
      {s && <input type="hidden" name="id" value={s.id} />}
      <label><span className="label">Name</span><input name="name" required defaultValue={s?.name} className="input" /></label>
      <label><span className="label">Nutzen</span><input name="benefits" defaultValue={s?.benefits ?? ""} className="input" /></label>
      <label className="md:col-span-2"><span className="label">Beschreibung</span><textarea name="description" rows={2} defaultValue={s?.description ?? ""} className="input" /></label>
      <fieldset><legend className="label">Adressierte Probleme</legend>
        <div className="max-h-48 space-y-1 overflow-y-auto rounded border border-ink-200 p-2 text-sm">
          {cats.map((c) => (
            <div key={c.id}><div className="text-xs font-semibold text-ink-500">{c.name}</div>
              {c.problems.map((p) => <label key={p.id} className="flex items-center gap-2"><input type="checkbox" name="problemIds" value={p.id} defaultChecked={s?.problems.some((x) => x.problemId === p.id)} />{p.name}</label>)}
            </div>
          ))}
        </div>
      </fieldset>
      <fieldset><legend className="label">Enthaltene Dienstleistungen</legend>
        <div className="max-h-48 space-y-1 overflow-y-auto rounded border border-ink-200 p-2 text-sm">
          {services.map((v) => <label key={v.id} className="flex items-center gap-2"><input type="checkbox" name="serviceIds" value={v.id} defaultChecked={s?.services.some((x) => x.serviceId === v.id)} />{v.name}</label>)}
        </div>
      </fieldset>
      {s && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={s.active} /> aktiv</label>}
      <div><SubmitButton className="btn-primary btn-sm">{s ? "Speichern" : "Lösung anlegen"}</SubmitButton></div>
    </form>
  );
  return (
    <div className="space-y-3">
      {solutions.length === 0 && <Empty>Noch keine Lösungen.</Empty>}
      {solutions.map((s) => (
        <details key={s.id} className="card px-5 py-3">
          <summary className="flex cursor-pointer flex-wrap items-center gap-2">
            <span className={`font-medium ${s.active ? "" : "text-ink-400 line-through"}`}>{s.name}</span>
            <span className="text-xs text-ink-500">{s.problems.length} Probleme · {s.services.length} Leistungen · bei {s._count.companies} Unternehmen</span>
          </summary>
          <div className="mt-3"><Form s={s} /></div>
          <form action={A.deleteSolution} className="mt-2"><input type="hidden" name="id" value={s.id} /><SubmitButton className="btn-danger btn-sm" confirm="Lösung löschen?">Löschen</SubmitButton></form>
        </details>
      ))}
      <section className="card-pad"><div className="mb-2 text-sm font-semibold">Neue Lösung</div><Form /></section>
    </div>
  );
}

async function Services({ tenantId }: { tenantId: string }) {
  const services = await db.service.findMany({ where: { tenantId }, orderBy: { name: "asc" }, include: { dependsOn: true } });
  const Form = ({ s }: { s?: (typeof services)[number] }) => (
    <form action={A.saveService} className="grid gap-2 md:grid-cols-6">
      {s && <input type="hidden" name="id" value={s.id} />}
      <label className="md:col-span-2"><span className="label">Name</span><input name="name" required defaultValue={s?.name} className="input" /></label>
      <label><span className="label">Preismodell</span><select name="pricingModel" defaultValue={s?.pricingModel ?? "FIXED"} className="input">{PRICING.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      <label><span className="label">Preis (€ netto)</span><input name="unitPrice" type="number" step="0.01" min={0} defaultValue={s?.unitPrice ?? 0} className="input" /></label>
      <label><span className="label">Einheit</span><input name="unit" defaultValue={s?.unit ?? ""} className="input" /></label>
      <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" name="recurring" defaultChecked={s?.recurring} /> laufend</label>
      <label className="md:col-span-4"><span className="label">Beschreibung</span><input name="description" defaultValue={s?.description ?? ""} className="input" /></label>
      <label className="md:col-span-2"><span className="label">Setzt voraus (Mehrfachauswahl)</span>
        <select name="dependsOn" multiple className="input h-20" defaultValue={s?.dependsOn.map((d) => d.dependsOnId)}>
          {services.filter((x) => x.id !== s?.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </label>
      {s && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={s.active} /> aktiv</label>}
      <div><SubmitButton className="btn-primary btn-sm">{s ? "Speichern" : "Anlegen"}</SubmitButton></div>
    </form>
  );
  const names = new Map(services.map((s) => [s.id, s.name]));
  return (
    <div className="space-y-3">
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Dienstleistung</th><th>Preis</th><th>Modell</th><th>Voraussetzungen</th><th></th></tr></thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id}>
                <td colSpan={5} className="p-0">
                  <details className="px-3 py-2">
                    <summary className="grid cursor-pointer grid-cols-[2fr_1fr_1fr_2fr] gap-3 text-sm">
                      <span className={s.active ? "" : "text-ink-400 line-through"}>{s.name}</span>
                      <span>{eur(s.unitPrice, true)}{s.unit ? ` / ${s.unit}` : ""}</span>
                      <span>{PRICING_LABEL[s.pricingModel]}{s.recurring && " · laufend"}</span>
                      <span className="text-xs text-ink-500">{s.dependsOn.map((d) => names.get(d.dependsOnId)).join(", ") || "–"}</span>
                    </summary>
                    <div className="mt-3"><Form s={s} /></div>
                    <form action={A.deleteService} className="mt-2"><input type="hidden" name="id" value={s.id} /><SubmitButton className="btn-danger btn-sm" confirm="Dienstleistung löschen?">Löschen</SubmitButton></form>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="card-pad"><div className="mb-2 text-sm font-semibold">Neue Dienstleistung</div><Form /></section>
    </div>
  );
}

async function Packages({ tenantId }: { tenantId: string }) {
  const [packages, services] = await Promise.all([
    db.servicePackage.findMany({ where: { tenantId }, include: { items: { include: { service: true } } }, orderBy: { name: "asc" } }),
    db.service.findMany({ where: { tenantId, active: true }, orderBy: { name: "asc" } }),
  ]);
  const Form = ({ p }: { p?: (typeof packages)[number] }) => (
    <form action={A.savePackage} className="space-y-2">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-2 md:grid-cols-2">
        <input name="name" required defaultValue={p?.name} placeholder="Name" className="input" />
        <input name="description" defaultValue={p?.description ?? ""} placeholder="Beschreibung" className="input" />
      </div>
      <div className="grid gap-1 text-sm md:grid-cols-2">
        {services.map((s) => (
          <label key={s.id} className="flex items-center gap-2">
            <input name={`qty_${s.id}`} type="number" min={0} step="0.5" defaultValue={p?.items.find((i) => i.serviceId === s.id)?.quantity ?? ""} className="input w-20 py-1" placeholder="0" />
            {s.name}
          </label>
        ))}
      </div>
      <SubmitButton className="btn-primary btn-sm">{p ? "Speichern" : "Paket anlegen"}</SubmitButton>
    </form>
  );
  return (
    <div className="space-y-3">
      {packages.map((p) => (
        <details key={p.id} className="card px-5 py-3">
          <summary className="cursor-pointer"><span className="font-medium">{p.name}</span> <span className="text-xs text-ink-500">{p.items.map((i) => `${i.quantity}× ${i.service.name}`).join(", ")}</span></summary>
          <div className="mt-3"><Form p={p} /></div>
          <form action={A.deletePackage} className="mt-2"><input type="hidden" name="id" value={p.id} /><SubmitButton className="btn-danger btn-sm" confirm="Paket löschen?">Löschen</SubmitButton></form>
        </details>
      ))}
      <section className="card-pad"><div className="mb-2 text-sm font-semibold">Neues Leistungspaket (Menge je Leistung)</div><Form /></section>
    </div>
  );
}

async function Templates({ tenantId }: { tenantId: string }) {
  const templates = await db.offerTemplate.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
  const Form = ({ t }: { t?: (typeof templates)[number] }) => {
    const s = (t?.sections ?? {}) as OfferSections;
    return (
      <form action={A.saveTemplate} className="grid gap-2 md:grid-cols-2">
        {t && <input type="hidden" name="id" value={t.id} />}
        <label className="md:col-span-2"><span className="label">Name</span><input name="name" defaultValue={t?.name} className="input" /></label>
        {OFFER_SECTIONS.map((sec) => <label key={sec.key}><span className="label">{sec.label}</span><textarea name={`s_${sec.key}`} rows={3} defaultValue={s[sec.key] ?? ""} className="input" /></label>)}
        <div><SubmitButton className="btn-primary btn-sm">{t ? "Speichern" : "Vorlage anlegen"}</SubmitButton></div>
      </form>
    );
  };
  return (
    <div className="space-y-3">
      {templates.map((t) => (
        <details key={t.id} className="card px-5 py-3">
          <summary className="cursor-pointer font-medium">{t.name}</summary>
          <div className="mt-3"><Form t={t} /></div>
          <form action={A.deleteTemplate} className="mt-2"><input type="hidden" name="id" value={t.id} /><SubmitButton className="btn-danger btn-sm" confirm="Vorlage löschen?">Löschen</SubmitButton></form>
        </details>
      ))}
      <section className="card-pad"><div className="mb-2 text-sm font-semibold">Neue Angebotsvorlage</div><Form /></section>
    </div>
  );
}
