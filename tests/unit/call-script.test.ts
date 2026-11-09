import { describe, it, expect } from "vitest";
import { CallScriptSchema, DEFAULT_CALL_SCRIPT, renderSay, ruleAssist } from "@/lib/call-script";

describe("Gesprächsleitfaden", () => {
  it("Standard-Leitfaden ist gültig (alle Verweise existieren)", () => {
    expect(CallScriptSchema.safeParse(DEFAULT_CALL_SCRIPT).success).toBe(true);
  });

  it("erkennt ungültige Verweise", () => {
    const broken = structuredClone(DEFAULT_CALL_SCRIPT);
    broken.nodes[0].answers[0].next = "gibt-es-nicht";
    const r = CallScriptSchema.safeParse(broken);
    expect(r.success).toBe(false);
  });

  it("verlangt einen Absagegrund bei REJECTED", () => {
    const broken = structuredClone(DEFAULT_CALL_SCRIPT);
    const a = broken.nodes.find((n) => n.id === "obj_price")!.answers.find((x) => x.id === "no_budget")!;
    delete a.reason;
    expect(CallScriptSchema.safeParse(broken).success).toBe(false);
  });

  it("ersetzt Platzhalter", () => {
    const t = renderSay("Hallo {{firstName}} von {{company}}", { firstName: "Thomas", lastName: "Müller", company: "Müller Maschinenbau GmbH", industry: "Maschinenbau", topic: "Angebote", consultant: "Alex" });
    expect(t).toBe("Hallo Thomas von Müller Maschinenbau GmbH");
  });

  it("ordnet Preis-Einwände regelbasiert zu", () => {
    const r = ruleAssist(DEFAULT_CALL_SCRIPT, "reason", "Das ist uns bestimmt zu teuer");
    expect(r.nextNodeId).toBe("obj_price");
  });

  it("erkennt Rückruf-Wunsch", () => {
    const r = ruleAssist(DEFAULT_CALL_SCRIPT, "opening", "Rufen Sie mich nächste Woche nochmal an");
    expect(r.nextNodeId).toBe("callback");
  });

  it("erkennt falsch verbunden als Ergebnis", () => {
    const r = ruleAssist(DEFAULT_CALL_SCRIPT, "reason", "Sie sind hier falsch verbunden");
    expect(r.outcome).toBe("WRONG_NUMBER");
  });
});
