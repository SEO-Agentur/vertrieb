# Architektur

**Modularer Monolith** auf Basis von Next.js 15 (App Router, React 19, TypeScript), PostgreSQL über Prisma 6, Tailwind CSS.
Keine Microservices – ein Web-Prozess plus ein optionaler Worker-Prozess.

```
src/
  app/
    (app)/            Internes Sales Command Center (geschützt, requireUser)
      dashboard, prospecting, companies/[id]?tab=…, contacts, qualification, research,
      rooms, outreach, activities, live, meetings/[id], analyses, catalog, offers/[id],
      pipeline, tasks, reports, settings
    room/[slug]/      Öffentliche, geschützte Kundenwelt (eine Anwendung für alle Kunden)
    i/[token]         Einlösen eines Einladungslinks → Besuchersitzung
    api/              SSE-Streams, Video-Token, PDF, Besucher-Endpunkte, Health
  lib/                Fachlogik (framework-arm, testbar)
    scoring.ts        nachvollziehbares Lead-Scoring
    calculator.ts     Potenzial-/Wirtschaftlichkeitsrechner
    rooms.ts          Kundenwelten, Einladungen, Besuchersitzungen, öffentliche Projektion
    research.ts       KI-/regelbasierte Recherche
    ai/provider.ts    austauschbarer KI-Provider (Anthropic), Prompt-Injection-Schutz
    video.ts          LiveKit-Token
    pipeline.ts       Phasen & automatisches Vorrücken
    offers.ts, pdf.ts Angebote & PDF
    import.ts         CSV-Import mit Spaltenerkennung
    connectors/       Schnittstelle für CRM-/Datenanbieter
    seo.ts            SEO-Scanner-Integration
    retention.ts      Aufbewahrungsfristen
prisma/schema.prisma  Datenmodell (alle Tabellen mit tenantId → mandantenfähig vorbereitet)
scripts/worker.ts     Hintergrundjobs (Bereinigung, Follow-up-Hinweise)
scripts/e2e.mjs       End-to-End-Test des Vertriebsprozesses
```

## Kernprinzipien

- **Interne vs. externe Daten:** Was ein Besucher sieht, wird ausschließlich in `getPublicRoom()` (src/lib/rooms.ts) festgelegt.
  Nur explizit freigegebene Datensätze (`visibleInRoom`, `shareWithClient`, veröffentlichte Angebote, Dokumente mit Sichtbarkeit `ROOM`) werden ausgeliefert.
  Notizen, Scores, Fakten, ungeprüfte Hypothesen und interne Dokumente verlassen den Server nie.
- **Mandantenfähigkeit:** Jede fachliche Tabelle hängt an `Tenant`. Interne Lookups laufen über `src/lib/access.ts` (`companyForUser` usw.) mit Tenant-Filter.
- **Echtzeit:** Server-Sent Events (`/api/live/stream` für den Berater, `/api/room/[slug]/stream` für Besucher). SSE funktioniert durch Proxys und benötigt keinen separaten WebSocket-Server.
  Für mehrere Instanzen ist das Polling in der DB bereits instanzübergreifend korrekt.
- **Video:** LiveKit (WebRTC). Begründung: Open-Source-Server, in der EU selbst hostbar (Datenschutz), alternativ LiveKit Cloud; Bildschirmfreigabe,
  Wiederverbindung, Mobilunterstützung und React-Komponenten vorhanden. Daily wäre gleichwertig, ist aber nur als SaaS verfügbar.
- **KI:** Strukturierte Ausgaben mit Zod-Schema, externe/benutzerseitige Inhalte werden als `<untrusted_data>` übergeben,
  Ausgaben werden immer als Hypothese gespeichert und müssen menschlich geprüft werden. Keine Nachricht verlässt das System ohne menschliche Freigabe.
- **Pipeline-Automatik:** Ereignisse (Kundenwelt besucht, Gespräch angefragt, Angebot veröffentlicht/angenommen …) rücken die Phase nur vorwärts vor.

## Datenmodell (Auszug)

Tenant · User · Company · CompanyFact (Quelle, Abrufdatum, Status VERIFIED/ESTIMATED/HYPOTHESIS/UNKNOWN) · ImprovementHypothesis · Contact ·
PipelineStage · Room · RoomInvite (nur Token-Hash) · RoomSession (Einwilligungen) · RoomEvent · EmailVerification · RoomMessage · Document ·
Meeting · MeetingNote · ProblemCategory · Problem · Solution · Service · ServicePackage · ServiceDependency · OfferTemplate · Finding ·
CompanySolution · EconomicAnalysis · Offer · OfferItem · Project · OutreachMessage · Activity · Task · SeoScan · Notification · AuditLog · OutboxEmail · Job
