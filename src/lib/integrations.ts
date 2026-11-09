import "server-only";
import { aiStatus } from "./ai/provider";
import { videoStatus } from "./video";
import { smtpConfigured } from "./mailer";
import { seoStatus } from "./seo";

export type IntegrationState = { key: string; name: string; enabled: boolean; detail: string; required: string[] };

export function integrationStates(): IntegrationState[] {
  const ai = aiStatus();
  const video = videoStatus();
  const seo = seoStatus();
  return [
    { key: "ai", name: `KI-Provider (${ai.provider}, ${ai.model})`, enabled: ai.enabled, detail: ai.enabled ? "Aktiv" : `Nicht aktiviert – ${ai.reason}`, required: ["ANTHROPIC_API_KEY", "AI_MODEL (optional)"] },
    { key: "video", name: "Videoberatung (LiveKit)", enabled: video.enabled, detail: video.enabled ? `Aktiv – ${video.url}` : `Nicht aktiviert – ${video.reason}`, required: ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"] },
    { key: "smtp", name: "E-Mail-Versand (SMTP)", enabled: smtpConfigured(), detail: smtpConfigured() ? "Aktiv" : "Nicht aktiviert – E-Mails landen im Postausgang mit Status NOT_CONFIGURED", required: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] },
    { key: "seo", name: "SEO-Scanner (guaranteedseoservices.com)", enabled: seo.enabled, detail: seo.enabled ? "API-Endpunkt konfiguriert" : `Nicht aktiviert – ${seo.reason}. Manueller JSON-/CSV-Import ist verfügbar.`, required: ["SEO_SCANNER_API_URL", "SEO_SCANNER_API_KEY"] },
    { key: "linkedin", name: "LinkedIn / Sales Navigator", enabled: false, detail: "Keine offizielle API-Anbindung aktiv. Unterstützt: manuelle Erfassung, CSV-Import, gespeicherte Sales-Navigator-Suchen und URLs. Versand erfolgt manuell durch den Berater.", required: ["Offizielle Partner-Integration (SNAP) – noch nicht verfügbar"] },
    { key: "crm", name: "Externe CRM-Integration", enabled: false, detail: "Schnittstelle vorbereitet (src/lib/connectors). Aktuell: CSV-Import aus CRM-Exporten.", required: ["Anbieter-spezifische Zugangsdaten"] },
  ];
}
