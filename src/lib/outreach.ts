import type { Company, Contact, User } from "@prisma/client";

export const LINKEDIN_CONNECT_LIMIT = 300; // Zeichenlimit für Kontaktanfragen mit Notiz

export function salutation(contact: Pick<Contact, "firstName" | "lastName">) {
  return `Guten Tag ${contact.firstName} ${contact.lastName}`;
}

/**
 * Vorlagenbasierte, persönliche LinkedIn-Nachricht. Wird nie automatisch versendet –
 * der Berater prüft, gibt frei, kopiert und sendet manuell auf LinkedIn.
 */
export function buildLinkedinMessage(opts: {
  company: Pick<Company, "name" | "industry">;
  contact: Pick<Contact, "firstName" | "lastName" | "title">;
  consultant: Pick<User, "name">;
  topics: string[];
  inviteUrl?: string | null;
  kind: "INITIAL" | "FOLLOW_UP" | "CONNECT";
}): string {
  const { company, contact, consultant, topics, inviteUrl, kind } = opts;
  const topicText = topics.length ? topics.slice(0, 2).join(" und ") : "Neukundengewinnung und Angebotsprozesse";
  if (kind === "CONNECT") {
    return `${salutation(contact)}, ich beschäftige mich mit Vertriebsprozessen im ${company.industry ?? "B2B"}-Mittelstand und würde mich gerne mit Ihnen vernetzen. Beste Grüße, ${consultant.name}`.slice(0, LINKEDIN_CONNECT_LIMIT);
  }
  if (kind === "FOLLOW_UP") {
    return [
      `${salutation(contact)},`,
      ``,
      `ich wollte kurz an meine letzte Nachricht anknüpfen. Die für ${company.name} vorbereitete Übersicht steht weiterhin für Sie bereit${inviteUrl ? `:\n${inviteUrl}` : "."}`,
      ``,
      `Wenn das Thema gerade nicht passt, ist das völlig in Ordnung – eine kurze Rückmeldung genügt.`,
      ``,
      `Beste Grüße`,
      consultant.name,
    ].join("\n");
  }
  return [
    `${salutation(contact)},`,
    ``,
    `ich habe mich mit ${company.name} beschäftigt und eine kleine persönliche Übersicht für Sie vorbereitet. Darin geht es um die Frage, wo sich Vertrieb im ${company.industry ?? "B2B"}-Umfeld mit KI sinnvoll weiterentwickeln lässt – etwa bei ${topicText}.`,
    ``,
    `Ich behaupte nicht, Ihre Herausforderungen schon zu kennen. Die Idee ist, gemeinsam herauszufinden, ob und wo Verbesserungen wirtschaftlich sinnvoll sind.`,
    inviteUrl ? `\nIhre persönliche Seite (nur für Sie freigeschaltet):\n${inviteUrl}\n` : ``,
    `Hätten Sie Interesse an einem kurzen Austausch?`,
    ``,
    `Beste Grüße`,
    consultant.name,
  ].join("\n");
}
