import Link from "next/link";
import { requireEditor } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import { CompanyForm } from "../CompanyForm";
import { createCompanyAction } from "../actions";

export default async function NewCompanyPage({ searchParams }: { searchParams: Promise<{ duplicate?: string; name?: string }> }) {
  const user = await requireEditor();
  const sp = await searchParams;
  const icp = await getSetting(user.tenantId, "icp");
  const dups = sp.duplicate ? await db.company.findMany({ where: { tenantId: user.tenantId, id: { in: sp.duplicate.split(",") } }, select: { id: true, name: true } }) : [];
  return (
    <div className="max-w-5xl">
      <PageHeader title="Unternehmen anlegen" subtitle="Manuelle Erfassung, z.B. aus LinkedIn Sales Navigator." />
      {dups.length > 0 && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Mögliche Dublette für „{sp.name}“:</strong>{" "}
          {dups.map((d) => <Link key={d.id} className="link mr-2" href={`/companies/${d.id}`}>{d.name}</Link>)}
          <div className="mt-1">Wenn es sich um ein anderes Unternehmen handelt, Formular mit „Dubletten ignorieren“ erneut speichern.</div>
        </div>
      )}
      <div className="card-pad">
        <CompanyForm action={async (f) => { "use server"; if (dups.length) f.set("ignoreDuplicates", "on"); await createCompanyAction(f); }} industries={icp.preferredIndustries} submitLabel={dups.length ? "Trotzdem anlegen (Dubletten ignorieren)" : "Unternehmen anlegen"} />
      </div>
    </div>
  );
}
