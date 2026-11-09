import type { Tone } from "@/components/ui";
export const OFFER_STATUS: Record<string, [string, Tone]> = {
  DRAFT: ["Entwurf", "gray"],
  PUBLISHED: ["Veröffentlicht", "blue"],
  ACCEPTED: ["Angenommen", "green"],
  DECLINED: ["Abgelehnt", "red"],
  SUPERSEDED: ["Ersetzt", "gray"],
  WITHDRAWN: ["Zurückgezogen", "amber"],
};
