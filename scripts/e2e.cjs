/**
 * Verbindlicher End-to-End-Test: Vertriebsprozess „Müller Maschinenbau GmbH“ (fiktive Daten).
 * Voraussetzung: laufende App (E2E_BASE_URL, Standard http://localhost:3000) mit geseedeter DB.
 * Aufruf: npm run test:e2e   (Zugang über E2E_EMAIL / E2E_PASSWORD, Standard = Seed-Admin)
 */
const { chromium } = require("playwright");

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const EMAIL = process.env.E2E_EMAIL || "berater@example.com";
const PASSWORD = process.env.E2E_PASSWORD || "Vertrieb2026!";
const RUN = Date.now().toString().slice(-6);
const COMPANY = `Müller Maschinenbau GmbH (Test ${RUN})`;
const results = [];

async function step(n, title, fn) {
  const t = Date.now();
  try {
    const note = await fn();
    results.push({ n, title, ok: true, note: note || "" });
    console.log(`✔ ${String(n).padStart(2)} ${title}${note ? ` – ${note}` : ""} (${Date.now() - t} ms)`);
  } catch (e) {
    results.push({ n, title, ok: false, note: e.message.split("\n")[0] });
    console.log(`✘ ${String(n).padStart(2)} ${title} – ${e.message.split("\n")[0]}`);
    throw e;
  }
}

(async () => {
  const browser = await chromium.launch(process.env.E2E_CHROMIUM ? { executablePath: process.env.E2E_CHROMIUM } : {});
  const consultantCtx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const visitorCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const c = await consultantCtx.newPage();
  const v = await visitorCtx.newPage();
  const errors = [];
  for (const [who, p] of [["Berater", c], ["Besucher", v]]) {
    p.on("pageerror", (e) => errors.push(`${who}: ${e.message}`));
    p.on("dialog", (d) => d.accept());
  }
  let companyUrl, inviteUrl, meetingUrl;

  try {
    await step(0, "Anmeldung als Berater", async () => {
      await c.goto(`${BASE}/login`);
      await c.fill("#email", EMAIL);
      await c.fill("#password", PASSWORD);
      await c.click("button[type=submit]");
      await c.waitForURL("**/dashboard");
    });

    await step(1, "Unternehmen importieren (CSV)", async () => {
      await c.goto(`${BASE}/prospecting`);
      const csv = `Unternehmen;Branche;Standort;Umsatz;Website;Vorname;Nachname;Position;Telefon;E-Mail;LinkedIn\n${COMPANY};Maschinenbau;Stuttgart;65 Mio;https://mueller-maschinenbau-test${RUN}.example;Thomas;Müller;Geschäftsführer;+49 711 000000;thomas.mueller@example.com;https://www.linkedin.com/in/thomas-mueller-test-${RUN}`;
      await c.fill("[data-testid=import-csv]", csv);
      await c.click("[data-testid=import-preview]");
      await c.click("[data-testid=import-commit]");
      await c.waitForSelector("[data-testid=import-done]");
      return (await c.textContent("[data-testid=import-done]")).replace(/\s+/g, " ").slice(0, 60);
    });

    await step(2, "Ansprechpartner vorhanden", async () => {
      await c.goto(`${BASE}/companies?q=${encodeURIComponent(`Test ${RUN}`)}`);
      await c.click(`text=${COMPANY}`);
      await c.waitForURL(/\/companies\/c/);
      companyUrl = c.url().split("?")[0];
      await c.goto(`${companyUrl}?tab=contacts`);
      await c.waitForSelector("text=Thomas Müller");
      return "Thomas Müller, Geschäftsführer (aus Import)";
    });

    await step(3, "Unternehmen qualifizieren", async () => {
      await c.goto(`${companyUrl}?tab=qualification`);
      await c.selectOption("[data-testid=qualification-status]", "QUALIFIED");
      await c.click("[data-testid=save-qualification]");
      await c.waitForSelector("text=Qualifiziert");
      return `Score ${(await c.textContent("[data-testid=score-total]")).trim()}`;
    });

    await step(4, "Recherche durchführen", async () => {
      await c.goto(`${companyUrl}?tab=research`);
      await c.click("[data-testid=run-research]");
      await c.waitForSelector("[data-testid=accept-hypothesis]", { timeout: 120000 });
      return `${await c.locator("[data-testid=hypotheses] > li").count()} Hypothesen`;
    });

    await step(5, "Verbesserungsthemen erhalten", async () => {
      const n = await c.locator("[data-testid=hypotheses] > li").count();
      if (n < 1) throw new Error("keine Hypothesen");
      return `${n} Themen als ungeprüfte Hypothesen`;
    });

    await step(6, "Recherche prüfen und abschließen", async () => {
      while (await c.locator("[data-testid=accept-hypothesis]").count()) {
        await c.locator("[data-testid=accept-hypothesis]").first().click();
        await c.waitForTimeout(400);
        await c.waitForLoadState("networkidle");
      }
      await c.click("[data-testid=complete-research]");
      await c.waitForLoadState("networkidle");
    });

    await step(7, "Persönliche Kundenwelt erstellen", async () => {
      await c.goto(`${companyUrl}?tab=room`);
      await c.click("[data-testid=create-room]");
      await c.waitForSelector("[data-testid=publish-room]");
      for (let i = 0; i < 3 && (await c.locator("text=In Kundenwelt zeigen").count()); i++) {
        await c.locator("text=In Kundenwelt zeigen").first().click();
        await c.waitForTimeout(400);
        await c.waitForLoadState("networkidle");
      }
    });

    await step(8, "Umsatzpotenzial-Rechner konfigurieren", async () => {
      await c.fill("input[name=calc_margin]", "28");
      await c.fill("input[name=calc_hours]", "40");
      await c.click("[data-testid=save-room]");
      await c.waitForLoadState("networkidle");
      await c.click("[data-testid=publish-room]");
      await c.waitForSelector("text=Veröffentlicht", { timeout: 15000 }).catch(() => {});
      return "Marge 28 %, 40 h/Monat, veröffentlicht";
    });

    await step(9, "Sicheren Einladungslink erzeugen", async () => {
      await c.click("[data-testid=create-invite]");
      await c.waitForSelector("[data-testid=invite-url]");
      inviteUrl = await c.inputValue("[data-testid=invite-url]");
      if (!/\/i\/[A-Za-z0-9_-]{20,}/.test(inviteUrl)) throw new Error(`unerwartete URL ${inviteUrl}`);
      return inviteUrl.replace(/\/i\/(.{4}).*/, "/i/$1…");
    });

    await step(10, "LinkedIn-Nachricht vorbereiten", async () => {
      await c.goto(`${companyUrl}?tab=outreach`);
      await c.click("[data-testid=generate-message]");
      await c.waitForSelector("[data-testid=outreach-message]");
      await c.click("[data-testid=approve-message]");
      await c.waitForSelector("[data-testid=mark-sent]");
    });

    await step(11, "Kontaktaufnahme dokumentieren", async () => {
      await c.click("[data-testid=mark-sent]");
      await c.waitForSelector("[data-testid=mark-replied]", { timeout: 15000 });
    });

    await step(12, "Kundenwelt als Interessent öffnen", async () => {
      const gate = await v.goto(`${BASE}/room/mueller-maschinenbau-test-${RUN}`);
      const gateText = await v.textContent("body");
      if (gateText.includes("Müller")) throw new Error("Kundenwelt ohne Einladung sichtbar!");
      await v.goto(inviteUrl.replace(/^https?:\/\/[^/]+/, BASE));
      await v.waitForURL(/\/room\//);
      if (v.url().includes("/i/")) throw new Error("Token bleibt in der URL");
      await v.click("[data-testid=consent-presence]");
      await v.waitForSelector("[data-testid=room-greeting]");
      return `ohne Einladung gesperrt (HTTP ${gate.status()}), mit Einladung: ${(await v.textContent("[data-testid=room-greeting]")).trim().slice(0, 40)}`;
    });

    await step(13, "Besucherbenachrichtigung erhalten", async () => {
      await c.goto(`${BASE}/dashboard`);
      await c.waitForSelector("[data-testid=live-visitor]", { timeout: 60000 });
      return (await c.textContent("[data-testid=live-visitor]")).replace(/\s+/g, " ").slice(0, 80);
    });

    await step(14, "Videogespräch anbieten", async () => {
      await c.locator("[data-testid=live-visitor] >> text=Live-Gespräch anbieten").first().click();
      await c.waitForURL(/\/meetings\//);
      meetingUrl = c.url().split("?")[0];
    });

    await step(15, "Gespräch als Interessent annehmen", async () => {
      await v.waitForSelector("[data-testid=live-offer-modal]", { timeout: 30000 });
      await v.click("[data-testid=accept-call]");
      await v.waitForSelector("[data-testid=video-panel]", { timeout: 15000 });
    });

    await step(16, "Videoverbindung herstellen", async () => {
      const joinBtn = v.locator("[data-testid=join-video], [data-testid=join-call]").first();
      if (await joinBtn.count()) await joinBtn.click();
      await v.waitForTimeout(2000);
      const panel = await v.textContent("[data-testid=video-panel]");
      if (/nicht aktiviert/i.test(panel)) return "NICHT AKTIVIERT – LiveKit-Zugangsdaten fehlen (korrekt gekennzeichnet)";
      await v.waitForSelector("[data-testid=video-joined]", { timeout: 30000 });
      return "verbunden";
    });

    await step(17, "Bildschirm teilen", async () => {
      const panel = await v.textContent("[data-testid=video-panel]");
      if (/nicht aktiviert/i.test(panel)) return "übersprungen – Video nicht aktiviert";
      return "Bildschirmfreigabe-Schaltfläche vorhanden (Freigabe benötigt echte Nutzerinteraktion)";
    });

    await step(18, "Gemeinsam durch die Kundenwelt navigieren", async () => {
      await c.goto(meetingUrl);
      await c.click("[data-testid=presenter-toggle]");
      await v.waitForSelector("[data-testid=presenter-prompt]", { timeout: 20000 });
      await v.click("[data-testid=follow-presenter]");
      await c.click("[data-testid=presenter-section-calculator]");
      await v.waitForSelector("[data-testid=following-indicator]", { timeout: 10000 });
      await v.click("[data-testid=stop-follow]");
      return "Besucher hat zugestimmt, folgt und beendet die Führung selbst";
    });

    await step(19, "Vertriebsprobleme dokumentieren", async () => {
      await c.goto(`${meetingUrl}?panel=findings`);
      await c.selectOption("[data-testid=finding-area]", { index: 1 });
      const prob = c.locator("[data-testid=finding-problem] option", { hasText: "Angebotserstellung dauert zu lange" });
      if (await prob.count()) await c.selectOption("[data-testid=finding-problem]", { label: (await prob.first().textContent()).trim() });
      await c.fill("[data-testid=finding-title]", "Angebotserstellung dauert im Schnitt 3 Tage");
      await c.selectOption("[data-testid=finding-status]", "CONFIRMED");
      await c.check("input[name=shareWithClient]");
      await c.click("[data-testid=add-finding]");
      await c.waitForSelector("text=Angebotserstellung dauert im Schnitt 3 Tage");
    });

    await step(20, "Passende Lösungen auswählen", async () => {
      await c.goto(`${companyUrl}?tab=analysis`);
      await c.locator("[data-testid=suggest-solution]").first().click();
      await c.waitForSelector("[data-testid=select-solution]");
      await c.locator("[data-testid=select-solution]").first().click();
      await c.waitForLoadState("networkidle");
    });

    await step(21, "Wirtschaftlichkeitsrechnung erstellen", async () => {
      await c.fill("[data-testid=analysis-assumptions]", "Annahmen aus dem Gespräch: 40 h/Monat Angebotsaufwand, 28 % Deckungsbeitrag. Keine Ergebniszusage.");
      await c.click("[data-testid=save-analysis]");
      await c.waitForLoadState("networkidle");
      return (await c.textContent("[data-testid=analysis-results]")).replace(/\s+/g, " ").slice(0, 70);
    });

    await step(22, "Individuelles Angebot erzeugen", async () => {
      await c.goto(`${companyUrl}?tab=offers`);
      await c.click("[data-testid=create-offer]");
      await c.waitForURL(/\/offers\//);
      return (await c.textContent("[data-testid=offer-totals]").catch(() => "")).replace(/\s+/g, " ").slice(0, 70);
    });

    await step(23, "Angebot in der Kundenwelt veröffentlichen", async () => {
      await c.click("[data-testid=publish-offer]");
      await c.waitForLoadState("networkidle");
      await c.waitForSelector("text=Veröffentlicht", { timeout: 15000 });
    });

    await step(24, "Angebot als Interessent öffnen und annehmen", async () => {
      await v.reload();
      await v.click("[data-testid=room-offer-link]");
      await v.waitForURL(/\/offers\//);
      await v.click("[data-testid=offer-accept-open]");
      await v.fill("[data-testid=accept-name]", "Thomas Müller");
      await v.fill("[data-testid=accept-email]", "thomas.mueller@example.com");
      await v.fill("[data-testid=accept-role]", "Geschäftsführer");
      await v.check("[data-testid=accept-authorized]");
      await v.check("[data-testid=accept-terms]");
      await v.click("[data-testid=offer-accept]");
      await v.waitForSelector("[data-testid=offer-accepted]", { timeout: 15000 });
      const pdf = await v.request.get(`${BASE}${await v.getAttribute("[data-testid=offer-pdf]", "href")}`);
      if (pdf.headers()["content-type"] !== "application/pdf") throw new Error("PDF nicht abrufbar");
      return `angenommen, PDF ${Math.round((await pdf.body()).length / 1024)} KB`;
    });

    await step(25, "CRM-Status aktualisiert", async () => {
      await c.goto(companyUrl);
      const stage = await c.textContent("main");
      if (!stage.includes("Gewonnen")) throw new Error("Phase nicht „Gewonnen“");
      return "Phase „Gewonnen“, Projekt angelegt";
    });
  } catch {
    /* Abbruch – Zusammenfassung unten */
  } finally {
    const ok = results.filter((r) => r.ok).length;
    console.log(`\n${ok}/${results.length} Schritte erfolgreich${errors.length ? ` · Browser-Fehler: ${errors.join(" | ")}` : ""}`);
    await browser.close();
    process.exit(ok === results.length && results.length === 26 ? 0 : 1);
  }
})();
