/**
 * Erweiterbare Schnittstellenarchitektur für Datenquellen (CRM, lizenzierte Unternehmensdatenanbieter,
 * künftige offizielle LinkedIn-Partner-Integrationen). Jede Quelle liefert normalisierte Datensätze,
 * die über denselben Importpfad (Dublettenprüfung, Status "Schätzung") laufen wie CSV-Importe.
 */
export type ConnectorCompany = {
  externalId: string;
  name: string;
  website?: string;
  linkedinUrl?: string;
  industry?: string;
  location?: string;
  revenueEur?: number | null;
  revenueSource?: string;
  employees?: number | null;
};

export type ConnectorContact = {
  externalId: string;
  companyExternalId: string;
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  linkedinUrl?: string;
};

export interface LeadSourceConnector {
  key: string;
  name: string;
  /** true nur, wenn gültige Zugangsdaten vorliegen – sonst wird die Quelle als "nicht aktiviert" angezeigt. */
  isConfigured(): boolean;
  fetchCompanies(query: Record<string, string>): Promise<ConnectorCompany[]>;
  fetchContacts(companyExternalIds: string[]): Promise<ConnectorContact[]>;
}

export const connectors: LeadSourceConnector[] = [];
// Registrierung künftiger Anbieter, z.B.: connectors.push(new HubSpotConnector()) – keine simulierten Quellen.
