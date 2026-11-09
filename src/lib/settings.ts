import { db } from "./db";

export type IcpConfig = {
  minRevenueEur: number;
  preferredRevenueMinEur: number;
  preferredRevenueMaxEur: number;
  country: string;
  preferredIndustries: string[];
  lowPriorityIndustries: string[];
  preferredOwnership: string[];
  targetRoles: string[];
};

export type ScoringConfig = {
  weights: { icpFit: number; salesPotential: number; digitalPotential: number; economicPotential: number; feasibility: number; engagement: number };
  thresholds: { qualified: number; hot: number };
};

export type PrivacyConfig = {
  roomSessionDays: number;
  inviteDefaultDays: number;
  roomEventRetentionDays: number;
  disqualifiedRetentionDays: number;
  privacyContactEmail: string;
  imprintUrl: string;
  privacyUrl: string;
};

export type ConsultantBrand = {
  companyName: string;
  claim: string;
  positioning: string;
};

export const DEFAULT_ICP: IcpConfig = {
  minRevenueEur: 20_000_000,
  preferredRevenueMinEur: 20_000_000,
  preferredRevenueMaxEur: 200_000_000,
  country: "DE",
  preferredIndustries: [
    "Maschinenbau",
    "Technischer Großhandel",
    "Industriebedarf",
    "Industrielle Zulieferer",
    "Verpackungsindustrie",
    "B2B-Logistik",
    "IT-Systemhäuser",
    "Managed Services",
    "Personaldienstleister (B2B)",
    "Technische Dienstleistungen",
    "Fertigungsunternehmen",
  ],
  lowPriorityIndustries: ["Pharma", "Medizintechnik", "Banken", "Versicherungen", "Rüstung", "Energieversorger", "Öffentliche Verwaltung"],
  preferredOwnership: ["inhabergeführt", "familiengeführt", "mittelständisch"],
  targetRoles: ["CEO", "OWNER", "SALES_HEAD", "CCO", "BD", "COO", "DIGITAL"],
};

export const DEFAULT_SCORING: ScoringConfig = {
  weights: { icpFit: 25, salesPotential: 20, digitalPotential: 15, economicPotential: 20, feasibility: 10, engagement: 10 },
  thresholds: { qualified: 55, hot: 75 },
};

export const DEFAULT_PRIVACY: PrivacyConfig = {
  roomSessionDays: 30,
  inviteDefaultDays: 30,
  roomEventRetentionDays: 180,
  disqualifiedRetentionDays: 365,
  privacyContactEmail: "datenschutz@example.com",
  imprintUrl: "",
  privacyUrl: "",
};

export const DEFAULT_BRAND: ConsultantBrand = {
  companyName: "Vertriebspotenzial-Beratung",
  claim: "Ich helfe Ihnen herauszufinden, wo Sie Ihren Vertrieb mit KI verbessern können, und entwickle anschließend die passende Lösung für Ihr Unternehmen.",
  positioning:
    "Wir wissen nicht im Voraus, wo ein Unternehmen durch KI profitieren kann. Wir finden es gemeinsam heraus und entwickeln anschließend die passende Lösung.",
};

const DEFAULTS = { icp: DEFAULT_ICP, scoring: DEFAULT_SCORING, privacy: DEFAULT_PRIVACY, brand: DEFAULT_BRAND } as const;
type Key = keyof typeof DEFAULTS;
type ValueOf<K extends Key> = (typeof DEFAULTS)[K];

export async function getSetting<K extends Key>(tenantId: string, key: K): Promise<ValueOf<K>> {
  const row = await db.setting.findUnique({ where: { tenantId_key: { tenantId, key } } });
  const def = DEFAULTS[key] as object;
  if (!row) return DEFAULTS[key];
  return { ...def, ...(row.value as object) } as ValueOf<K>;
}

export async function setSetting<K extends Key>(tenantId: string, key: K, value: ValueOf<K>) {
  await db.setting.upsert({
    where: { tenantId_key: { tenantId, key } },
    update: { value: value as object },
    create: { tenantId, key, value: value as object },
  });
}
