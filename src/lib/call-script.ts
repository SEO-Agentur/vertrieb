import { z } from "zod";

/**
 * KI-gestützter Telefonleitfaden.
 * Rechtlich bewusst so gebaut, dass KEIN Gespräch mitgeschnitten wird: verarbeitet werden nur
 * die Klicks und Eingaben des Beraters (§ 201 StGB, DSGVO).
 */

export const OUTCOMES = ["APPOINTMENT", "FOLLOW_UP", "REJECTED", "NOT_REACHED", "WRONG_NUMBER", "WRONG_PERSON"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const OUTCOME_LABEL: Record<Outcome, string> = {
  APPOINTMENT: "Termin vereinbart",
  FOLLOW_UP: "Wiedervorlage",
  REJECTED: "Absage",
  NOT_REACHED: "Nicht erreicht",
  WRONG_NUMBER: "Falsch verbunden",
  WRONG_PERSON: "Falsche Person",
};

export const REJECTION_REASONS = {
  TOO_EXPENSIVE: "zu teuer / kein Budget",
  NO_INTEREST: "kein Interesse",
  ALREADY_PROJECTED: "schon projektiert / bereits Lösung",
  TOO_LATE: "zu spät",
  NO_NEED: "kein Bedarf",
  WRONG_COMPANY: "falsche Firma",
  WRONG_PERSON: "falsche Person",
  OTHER: "sonstiges",
} as const;
export type RejectionReason = keyof typeof REJECTION_REASONS;

export const AnswerKinds = ["positive", "neutral", "objection", "negative"] as const;

const AnswerSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(160),
  kind: z.enum(AnswerKinds),
  next: z.string().max(60).optional(),
  outcome: z.enum(OUTCOMES).optional(),
  reason: z.enum(Object.keys(REJECTION_REASONS) as [RejectionReason, ...RejectionReason[]]).optional(),
});

const NodeSchema = z.object({
  id: z.string().min(1).max(60),
  phase: z.string().min(1).max(60),
  title: z.string().min(1).max(120),
  say: z.string().min(1).max(2000),
  hint: z.string().max(500).optional(),
  answers: z.array(AnswerSchema).min(1).max(12),
});

export const CallScriptSchema = z
  .object({
    name: z.string().min(1).max(120),
    startId: z.string().min(1),
    nodes: z.array(NodeSchema).min(1).max(80),
  })
  .superRefine((s, ctx) => {
    const ids = new Set(s.nodes.map((n) => n.id));
    if (ids.size !== s.nodes.length) ctx.addIssue({ code: "custom", message: "Schritt-IDs müssen eindeutig sein." });
    if (!ids.has(s.startId)) ctx.addIssue({ code: "custom", message: `Startschritt "${s.startId}" existiert nicht.` });
    for (const n of s.nodes)
      for (const a of n.answers) {
        if (!a.next && !a.outcome) ctx.addIssue({ code: "custom", message: `Antwort "${a.label}" (${n.id}) braucht "next" oder "outcome".` });
        if (a.next && !ids.has(a.next)) ctx.addIssue({ code: "custom", message: `Antwort "${a.label}" verweist auf unbekannten Schritt "${a.next}".` });
        if (a.outcome === "REJECTED" && !a.reason) ctx.addIssue({ code: "custom", message: `Absage-Antwort "${a.label}" braucht einen Grund ("reason").` });
      }
  });

export type CallScript = z.infer<typeof CallScriptSchema>;
export type CallNode = CallScript["nodes"][number];
export type CallAnswer = CallNode["answers"][number];

export type ScriptVars = { firstName: string; lastName: string; company: string; industry: string; topic: string; consultant: string };

/** Platzhalter {{firstName}}, {{lastName}}, {{company}}, {{industry}}, {{topic}}, {{consultant}} ersetzen. */
export function renderSay(text: string, vars: ScriptVars): string {
  return text.replace(/\{\{(\w+)\}\}/g, (m, k: string) => (k in vars ? (vars as Record<string, string>)[k] || "" : m));
}

export const DEFAULT_CALL_SCRIPT: CallScript = {
  name: "Erstgespräch Potenzialanalyse (B2B-Mittelstand)",
  startId: "opening",
  nodes: [
    {
      id: "opening", phase: "Einstieg", title: "Begrüßung & Erlaubnis",
      say: "Guten Tag {{firstName}} {{lastName}}, hier ist {{consultant}}. Ich rufe an, weil ich mich mit {{company}} beschäftigt habe. Haben Sie zwei Minuten – oder passt es gerade schlecht?",
      hint: "Ruhig und kurz. Erlaubnis einholen statt sofort pitchen.",
      answers: [
        { id: "ok", label: "Ja, kurz", kind: "positive", next: "reason" },
        { id: "what", label: "Worum geht's?", kind: "neutral", next: "reason" },
        { id: "bad_time", label: "Passt gerade schlecht", kind: "neutral", next: "callback" },
        { id: "no_interest", label: "Kein Interesse", kind: "objection", next: "obj_no_interest" },
        { id: "not_me", label: "Bin nicht zuständig", kind: "objection", next: "wrong_person" },
        { id: "wrong_number", label: "Falsch verbunden", kind: "negative", outcome: "WRONG_NUMBER" },
      ],
    },
    {
      id: "reason", phase: "Anlass", title: "Anlass & offene Frage",
      say: "Ich unterstütze Vertriebsverantwortliche im {{industry}}-Mittelstand dabei herauszufinden, wo KI im Vertrieb wirklich etwas bringt – zum Beispiel bei {{topic}}. Ich behaupte nicht, Ihre Situation schon zu kennen. Darf ich fragen: Wie gewinnen Sie heute neue Kunden?",
      answers: [
        { id: "referrals", label: "Empfehlungen / Bestandskunden", kind: "neutral", next: "discovery" },
        { id: "field_sales", label: "Außendienst / Messen", kind: "neutral", next: "discovery" },
        { id: "inbound", label: "Anfragen über Website", kind: "neutral", next: "discovery" },
        { id: "fine", label: "Läuft gut, kein Bedarf", kind: "objection", next: "obj_no_need" },
        { id: "already_ai", label: "Machen wir schon mit KI", kind: "objection", next: "obj_already" },
        { id: "send_info", label: "Schicken Sie mir Infos", kind: "objection", next: "obj_send_info" },
        { id: "price", label: "Was kostet das? / kein Budget", kind: "objection", next: "obj_price" },
      ],
    },
    {
      id: "discovery", phase: "Bedarf", title: "Engpass finden",
      say: "Wo kostet Sie das heute am meisten Zeit – eher bei der Suche nach passenden neuen Kunden, bei der Angebotserstellung oder bei der Nachverfolgung?",
      hint: "Zuhören. Die Antwort als Notiz festhalten – sie ist der Aufhänger für die Kundenwelt.",
      answers: [
        { id: "new_customers", label: "Neue Kunden finden", kind: "positive", next: "value" },
        { id: "quotes", label: "Angebote dauern lange", kind: "positive", next: "value" },
        { id: "follow_up", label: "Nachverfolgung", kind: "positive", next: "value" },
        { id: "nothing", label: "Eigentlich nirgends", kind: "objection", next: "obj_no_need" },
      ],
    },
    {
      id: "value", phase: "Nutzen", title: "Nutzen & Termin vorschlagen",
      say: "Genau dazu habe ich für {{company}} eine kurze persönliche Übersicht vorbereitet – inklusive eines Rechners, was schon 0,05 % mehr Umsatz bedeuten würden. Sollen wir uns das 20 Minuten gemeinsam anschauen?",
      hint: "Keine Zahlen versprechen – der Rechner arbeitet mit den Zahlen des Kunden.",
      answers: [
        { id: "yes", label: "Ja, gerne", kind: "positive", next: "close" },
        { id: "link", label: "Schicken Sie mir den Link", kind: "neutral", next: "send_link" },
        { id: "price", label: "Was kostet das?", kind: "objection", next: "obj_price" },
        { id: "later", label: "Später / gerade viel los", kind: "neutral", next: "callback" },
      ],
    },
    {
      id: "close", phase: "Abschluss", title: "Termin fixieren",
      say: "Prima. Passt Ihnen eher Anfang oder Ende nächster Woche – vormittags oder nachmittags?",
      answers: [
        { id: "booked", label: "Termin gefunden", kind: "positive", outcome: "APPOINTMENT" },
        { id: "check_cal", label: "Muss in den Kalender schauen", kind: "neutral", next: "callback" },
      ],
    },
    {
      id: "send_link", phase: "Abschluss", title: "Link senden & Wiedervorlage",
      say: "Gern – ich schicke Ihnen den Link über LinkedIn. Darf ich mich in ein paar Tagen kurz melden, ob etwas für Sie dabei ist?",
      hint: "E-Mail nur, wenn der Gesprächspartner ausdrücklich zustimmt (UWG).",
      answers: [
        { id: "ok_follow", label: "Ja, gerne", kind: "positive", outcome: "FOLLOW_UP" },
        { id: "no_follow", label: "Nein, nicht nötig", kind: "negative", outcome: "REJECTED", reason: "NO_INTEREST" },
      ],
    },
    {
      id: "callback", phase: "Abschluss", title: "Rückruf vereinbaren",
      say: "Kein Problem. Wann erreiche ich Sie am besten?",
      answers: [
        { id: "time_given", label: "Nennt einen Zeitpunkt", kind: "positive", outcome: "FOLLOW_UP" },
        { id: "too_late", label: "Thema ist für dieses Jahr durch", kind: "negative", outcome: "REJECTED", reason: "TOO_LATE" },
        { id: "no_callback", label: "Lieber nicht", kind: "negative", outcome: "REJECTED", reason: "NO_INTEREST" },
      ],
    },
    {
      id: "obj_no_interest", phase: "Einwand", title: "Einwand: kein Interesse",
      say: "Verstehe ich gut. Darf ich kurz fragen – liegt das eher am Thema KI generell oder am Zeitpunkt?",
      answers: [
        { id: "timing", label: "Am Zeitpunkt", kind: "neutral", next: "callback" },
        { id: "topic_no", label: "Thema passt nicht", kind: "negative", outcome: "REJECTED", reason: "NO_INTEREST" },
        { id: "projected", label: "Haben schon ein Projekt", kind: "objection", next: "obj_already" },
      ],
    },
    {
      id: "obj_no_need", phase: "Einwand", title: "Einwand: kein Bedarf",
      say: "Das freut mich zu hören. Die meisten, mit denen ich spreche, sind gut aufgestellt – und trotzdem gibt es fast immer eine Stelle, die Zeit kostet. Wenn Sie im Vertrieb eine Sache sofort verbessern könnten, welche wäre das?",
      answers: [
        { id: "names_one", label: "Nennt etwas", kind: "positive", next: "value" },
        { id: "really_no", label: "Nein, wirklich nicht", kind: "negative", outcome: "REJECTED", reason: "NO_NEED" },
      ],
    },
    {
      id: "obj_already", phase: "Einwand", title: "Einwand: haben wir schon",
      say: "Spannend – was setzen Sie bereits ein? Mir geht es nicht darum, etwas zu ersetzen, sondern zu sehen, wo noch ungenutztes Potenzial liegt.",
      answers: [
        { id: "works_well", label: "Läuft sehr gut", kind: "negative", outcome: "REJECTED", reason: "ALREADY_PROJECTED" },
        { id: "mixed", label: "Läuft durchwachsen", kind: "positive", next: "value" },
        { id: "in_progress", label: "Projekt läuft gerade erst an", kind: "neutral", next: "callback" },
      ],
    },
    {
      id: "obj_send_info", phase: "Einwand", title: "Einwand: schicken Sie Infos",
      say: "Mache ich gern. Damit es für Sie relevant ist: Was wäre das wichtigste Thema – neue Kunden, Angebote oder Bestandskunden?",
      answers: [
        { id: "topic_named", label: "Nennt ein Thema", kind: "positive", next: "send_link" },
        { id: "just_send", label: "Einfach schicken", kind: "neutral", next: "send_link" },
      ],
    },
    {
      id: "obj_price", phase: "Einwand", title: "Einwand: Preis / Budget",
      say: "Berechtigte Frage. Der erste Schritt ist eine kompakte Potenzialanalyse zum Festpreis – erst danach entscheiden Sie, ob und was umgesetzt wird. Ob sich das lohnt, rechnen wir gemeinsam mit Ihren eigenen Zahlen.",
      answers: [
        { id: "fair", label: "Klingt fair", kind: "positive", next: "close" },
        { id: "no_budget", label: "Kein Budget", kind: "negative", outcome: "REJECTED", reason: "TOO_EXPENSIVE" },
        { id: "later_budget", label: "Nächstes Budgetjahr", kind: "neutral", next: "callback" },
      ],
    },
    {
      id: "wrong_person", phase: "Einwand", title: "Richtigen Ansprechpartner finden",
      say: "Danke für die Offenheit. Wer kümmert sich bei Ihnen um den Vertrieb bzw. die Vertriebsprozesse?",
      hint: "Genannten Namen in der Notiz festhalten und danach als Kontakt anlegen.",
      answers: [
        { id: "names_person", label: "Nennt einen Namen", kind: "neutral", outcome: "WRONG_PERSON" },
        { id: "refuses", label: "Möchte keinen Namen nennen", kind: "negative", outcome: "WRONG_PERSON" },
        { id: "wrong_company", label: "Wir haben gar keinen Vertrieb", kind: "negative", outcome: "REJECTED", reason: "WRONG_COMPANY" },
      ],
    },
  ],
};

/** Regelbasierte Zuordnung einer frei eingetippten Antwort (Fallback ohne KI). */
const RULES: { re: RegExp; node?: string; outcome?: Outcome; reason?: RejectionReason }[] = [
  { re: /falsch verbunden|verwählt|falsche nummer/, outcome: "WRONG_NUMBER" },
  { re: /nicht zuständig|falsche person|kollege|kollegin|weiterleiten|zuständig ist/, node: "wrong_person" },
  { re: /kein vertrieb|falsche firma/, outcome: "REJECTED", reason: "WRONG_COMPANY" },
  { re: /teuer|budget|kosten|preis|geld/, node: "obj_price" },
  { re: /schon|bereits|haben wir|im einsatz|projekt läuft|projektiert|dienstleister/, node: "obj_already" },
  { re: /zu spät|dieses jahr|abgeschlossen/, outcome: "REJECTED", reason: "TOO_LATE" },
  { re: /später|keine zeit|gerade schlecht|nächste woche|rufen sie .*an|meeting|termin(e)? voll/, node: "callback" },
  { re: /info|unterlagen|mail|schicken|zusenden/, node: "obj_send_info" },
  { re: /kein bedarf|läuft gut|brauchen wir nicht|alles gut/, node: "obj_no_need" },
  { re: /kein interesse|nicht interessiert|nein danke/, node: "obj_no_interest" },
];

export type AssistResult = {
  mode: "AI" | "RULE";
  matchedAnswerId: string | null;
  interpretation: string;
  suggestedReply: string | null;
  nextNodeId: string | null;
  outcome: Outcome | null;
  reason: RejectionReason | null;
  aiDisabledReason?: string;
};

export function ruleAssist(script: CallScript, currentNodeId: string, input: string): AssistResult {
  const text = input.toLowerCase();
  const node = script.nodes.find((n) => n.id === currentNodeId);
  // 1. direkte Übereinstimmung mit einer Antwortoption des aktuellen Schritts
  if (node) {
    const words = (s: string) => s.toLowerCase().split(/[^a-zäöüß]+/).filter((w) => w.length > 3);
    const hit = node.answers.find((a) => words(a.label).some((w) => text.includes(w)));
    if (hit) return { mode: "RULE", matchedAnswerId: hit.id, interpretation: `Passt zu „${hit.label}“`, suggestedReply: null, nextNodeId: hit.next ?? null, outcome: hit.outcome ?? null, reason: hit.reason ?? null };
  }
  // 2. typische Einwände
  for (const r of RULES) {
    if (!r.re.test(text)) continue;
    if (r.outcome) return { mode: "RULE", matchedAnswerId: null, interpretation: `Erkannt: ${OUTCOME_LABEL[r.outcome]}${r.reason ? ` (${REJECTION_REASONS[r.reason]})` : ""}`, suggestedReply: null, nextNodeId: null, outcome: r.outcome, reason: r.reason ?? null };
    if (r.node && script.nodes.some((n) => n.id === r.node)) {
      const target = script.nodes.find((n) => n.id === r.node)!;
      return { mode: "RULE", matchedAnswerId: null, interpretation: `Erkannt: ${target.title}`, suggestedReply: null, nextNodeId: r.node, outcome: null, reason: null };
    }
  }
  // 3. Zustimmung
  if (/\b(ja|gerne|gern|okay|ok|klar|passt|einverstanden)\b/.test(text) && node) {
    const pos = node.answers.find((a) => a.kind === "positive");
    if (pos) return { mode: "RULE", matchedAnswerId: pos.id, interpretation: `Zustimmung → „${pos.label}“`, suggestedReply: null, nextNodeId: pos.next ?? null, outcome: pos.outcome ?? null, reason: pos.reason ?? null };
  }
  return { mode: "RULE", matchedAnswerId: null, interpretation: "Keine eindeutige Zuordnung – bitte eine Antwortoption wählen.", suggestedReply: null, nextNodeId: null, outcome: null, reason: null };
}
