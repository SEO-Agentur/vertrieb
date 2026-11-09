import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { companyForUser } from "@/lib/access";
import { db } from "@/lib/db";
import { Badge, ScoreBadge } from "@/components/ui";
import { millions, qualificationLabel } from "@/lib/format";
import { ErrorBanner } from "@/components/ErrorBanner";
import OverviewTab from "./tabs/OverviewTab";
import ContactsTab from "./tabs/ContactsTab";
import ResearchTab from "./tabs/ResearchTab";
import QualificationTab from "./tabs/QualificationTab";
import ActivitiesTab from "./tabs/ActivitiesTab";
import RoomTab from "./tabs/RoomTab";
import OutreachTab from "./tabs/OutreachTab";
import MeetingsTab from "./tabs/MeetingsTab";
import AnalysisTab from "./tabs/AnalysisTab";
import OffersTab from "./tabs/OffersTab";
import SeoTab from "./tabs/SeoTab";

const TABS = [
  ["overview", "Übersicht", OverviewTab],
  ["contacts", "Ansprechpartner", ContactsTab],
  ["research", "Recherche", ResearchTab],
  ["qualification", "Qualifizierung", QualificationTab],
  ["room", "Kundenwelt", RoomTab],
  ["outreach", "Outreach", OutreachTab],
  ["meetings", "Gespräche", MeetingsTab],
  ["analysis", "Potenzialanalyse", AnalysisTab],
  ["offers", "Angebote", OffersTab],
  ["seo", "SEO", SeoTab],
  ["activities", "Aktivitäten", ActivitiesTab],
] as const;

export default async function CompanyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; error?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { tab = "overview", error } = await searchParams;
  const company = await companyForUser(id, user);
  const stage = company.stageId ? await db.pipelineStage.findUnique({ where: { id: company.stageId } }) : null;
  const active = TABS.find((t) => t[0] === tab) ?? TABS[0];
  const Tab = active[2];
  return (
    <div>
      <div className="mb-1 text-xs text-ink-400"><Link href="/companies" className="hover:underline">Unternehmen</Link> /</div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="h1" data-testid="company-name">{company.name}</h1>
        <ScoreBadge score={company.score} />
        <Badge tone={company.qualificationStatus === "QUALIFIED" ? "green" : company.qualificationStatus === "DISQUALIFIED" ? "red" : company.qualificationStatus === "REVENUE_REVIEW" ? "amber" : "gray"}>{qualificationLabel[company.qualificationStatus]}</Badge>
        {stage && <span className="rounded px-2 py-0.5 text-xs text-white" style={{ background: stage.color }}>{stage.name}</span>}
        <span className="text-sm text-ink-500">{company.industry ?? "Branche unbekannt"} · {company.location ?? "Standort unbekannt"} · Umsatz {millions(company.revenueEur)}</span>
      </div>
      <nav className="mb-5 flex flex-wrap gap-1 border-b border-ink-200">
        {TABS.map(([key, label]) => (
          <Link key={key} href={`/companies/${company.id}?tab=${key}`} className={`-mb-px border-b-2 px-3 py-2 text-sm ${key === active[0] ? "border-ink-900 font-medium text-ink-950" : "border-transparent text-ink-500 hover:text-ink-800"}`}>
            {label}
          </Link>
        ))}
      </nav>
      <ErrorBanner error={error} />
      <Tab companyId={company.id} user={user} />
    </div>
  );
}
