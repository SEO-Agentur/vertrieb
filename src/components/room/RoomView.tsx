import type { CSSProperties, ReactNode } from "react";
import type { PublicRoom } from "@/lib/rooms";
import { roomDict } from "@/lib/room-i18n";
import { IMPROVEMENT_TOPICS } from "@/lib/research";
import { computeAll } from "@/lib/calculator";
import { CalculatorSection, CallRequest, MessageForm } from "./RoomClient";
import { ConsentBanner } from "./ConsentBanner";
import { RoomLive } from "./RoomLive";

const eur = (v: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
const dateDe = (d: Date | string | null) => (d ? new Date(d).toLocaleDateString("de-DE") : "");

const AREA_LABEL: Record<string, string> = { NEUKUNDEN: "Neukundengewinnung", PROZESSE: "Vertriebsprozesse", BESTAND: "Bestandskunden", DATEN: "Daten & Systeme", AUTOMATISIERUNG: "Automatisierung", SICHTBARKEIT: "Digitale Sichtbarkeit", ALLGEMEIN: "Allgemein" };

function RoomSection({ id, index, title, lead, children, tone = "light" }: { id: string; index: number; title: string; lead?: string; children: ReactNode; tone?: "light" | "dark" | "paper" }) {
  const bg = tone === "dark" ? "bg-[var(--primary)] text-white" : tone === "paper" ? "bg-[#f7f5f0]" : "bg-white";
  return (
    <section id={id} data-room-section={id} className={`${bg} scroll-mt-16 px-6 py-24 md:py-32`}>
      <div className="mx-auto max-w-5xl">
        <div className={`mb-4 text-xs font-medium uppercase tracking-[0.25em] ${tone === "dark" ? "text-white/60" : "text-[var(--accent)]"}`}>{String(index).padStart(2, "0")}</div>
        <h2 className="max-w-3xl font-serif text-3xl leading-tight md:text-5xl">{title}</h2>
        {lead && <p className={`mt-6 max-w-2xl text-lg leading-relaxed ${tone === "dark" ? "text-white/75" : "text-ink-600"}`}>{lead}</p>}
        <div className="mt-14">{children}</div>
      </div>
    </section>
  );
}

export function RoomView({ slug, data, privacy, brandName, session }: {
  slug: string;
  data: PublicRoom;
  privacy: { privacyUrl: string; imprintUrl: string; contact: string };
  brandName: string;
  session: { consentDecided: boolean; presence: boolean; analytics: boolean; followPresenter: boolean; name: string };
}) {
  const t = roomDict(data.language);
  const m = data.modules;
  const style = { "--primary": data.primaryColor, "--accent": data.accentColor } as CSSProperties;
  let n = 0;
  const idx = () => ++n;
  const hasResults = data.findings.length || data.solutions.length || data.analyses.length || data.seoScan;

  const nav: [string, string][] = [
    m.calculator && ["calculator", data.language === "en" ? "Potential" : "Potenzial"],
    m.areas && ["areas", data.language === "en" ? "Topics" : "Themen"],
    m.approach && ["approach", data.language === "en" ? "Approach" : "Vorgehen"],
    m.video && ["video", data.language === "en" ? "Consultation" : "Beratung"],
    m.solutions && ["solutions", data.language === "en" ? "Results" : "Ergebnisse"],
    m.offer && ["offer", data.language === "en" ? "Offer" : "Angebot"],
    m.next && ["next", data.language === "en" ? "Next steps" : "Nächste Schritte"],
  ].filter(Boolean) as [string, string][];

  return (
    <div style={style} className="min-h-screen bg-white font-sans text-ink-900" lang={data.language}>
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
          {data.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.logoUrl} alt={data.displayName} className="h-8 w-auto object-contain" referrerPolicy="no-referrer" />
          ) : (
            <span className="font-serif text-lg text-ink-950">{data.displayName}</span>
          )}
          <nav className="ml-auto hidden gap-5 text-sm text-ink-600 md:flex">
            {nav.map(([id, label]) => <a key={id} href={`#${id}`} className="hover:text-ink-950">{label}</a>)}
          </nav>
        </div>
      </header>

      {m.greeting && (
        <section id="greeting" data-room-section="greeting" className="relative overflow-hidden bg-[var(--primary)] px-6 pb-28 pt-28 text-white md:pb-40 md:pt-40">
          <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full opacity-20 blur-3xl" style={{ background: "var(--accent)" }} />
          <div className="relative mx-auto max-w-5xl">
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">{t.personalFor} {data.displayName}</div>
            <h1 className="mt-8 max-w-4xl font-serif text-4xl leading-[1.1] md:text-7xl" data-testid="room-greeting">{data.greeting}</h1>
            <p className="mt-10 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">{data.intro}</p>
            <div className="mt-12 h-px w-24" style={{ background: "var(--accent)" }} />
          </div>
        </section>
      )}

      {m.calculator && (
        <RoomSection id="calculator" index={idx()} title={t.calcTitle} lead={t.calcLead} tone="paper">
          <CalculatorSection slug={slug} initial={data.calculator} analytics={session.analytics} />
        </RoomSection>
      )}

      {m.areas && (
        <RoomSection id="areas" index={idx()} title={t.areasTitle} lead={data.hypotheses.length ? t.areasLead : t.areasDefaultLead}>
          <div className="grid gap-px overflow-hidden rounded-sm bg-ink-100 md:grid-cols-2">
            {data.hypotheses.length
              ? data.hypotheses.map((h, i) => (
                  <div key={h.id} className="bg-white p-8">
                    <div className="text-xs tabular-nums text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="mt-2 font-serif text-2xl text-ink-950">{h.topic}</h3>
                    <p className="mt-3 leading-relaxed text-ink-600">{h.rationale}</p>
                    <div className="mt-4 text-[11px] uppercase tracking-wider text-ink-400">{h.status === "CONFIRMED" ? "Gemeinsam bestätigt" : "Hypothese – zu prüfen"}</div>
                  </div>
                ))
              : IMPROVEMENT_TOPICS.map((topic, i) => (
                  <div key={topic} className="bg-white p-8">
                    <div className="text-xs tabular-nums text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="mt-2 font-serif text-2xl text-ink-950">{topic}</h3>
                    <div className="mt-3 text-[11px] uppercase tracking-wider text-ink-400">Themenfeld</div>
                  </div>
                ))}
          </div>
        </RoomSection>
      )}

      {m.approach && (
        <RoomSection id="approach" index={idx()} title={t.approachTitle} lead={data.approachText} tone="dark">
          <ol className="grid gap-10 md:grid-cols-3">
            {t.approachSteps.map(([title, text], i) => (
              <li key={title} className="border-t border-white/20 pt-6">
                <div className="font-serif text-5xl text-[var(--accent)]">{i + 1}</div>
                <h3 className="mt-4 text-xl font-medium">{title}</h3>
                <p className="mt-2 leading-relaxed text-white/70">{text}</p>
              </li>
            ))}
          </ol>
        </RoomSection>
      )}

      {m.video && (
        <RoomSection id="video" index={idx()} title={t.videoTitle} lead={t.videoLead} tone="paper">
          <div className="grid gap-10 md:grid-cols-[1fr_20rem]">
            <CallRequest slug={slug} t={t} hasOpenRequest={data.meetings.some((x) => x.status === "REQUESTED")} />
            {data.consultant && (
              <div className="border-l border-ink-200 pl-8">
                <div className="text-xs uppercase tracking-wider text-ink-500">{t.yourContact}</div>
                <div className="mt-3 font-serif text-2xl">{data.consultant.name}</div>
                {data.consultant.title && <div className="text-sm text-ink-500">{data.consultant.title}</div>}
                {data.consultant.calendarUrl && (
                  <a href={data.consultant.calendarUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block border-b border-[var(--accent)] pb-0.5 text-sm">{t.bookCalendar} →</a>
                )}
              </div>
            )}
          </div>
        </RoomSection>
      )}

      {m.solutions && (
        <RoomSection id="solutions" index={idx()} title={t.solutionsTitle} lead={hasResults ? undefined : t.solutionsEmpty}>
          {hasResults ? (
            <div className="space-y-16">
              {data.findings.length > 0 && (
                <div>
                  <h3 className="mb-6 text-xs uppercase tracking-[0.2em] text-ink-500">{t.findings}</h3>
                  <div className="divide-y divide-ink-100 border-y border-ink-100">
                    {data.findings.map((f) => (
                      <div key={f.id} className="grid gap-2 py-6 md:grid-cols-[12rem_1fr]">
                        <div className="text-sm text-[var(--accent)]">{AREA_LABEL[f.area] ?? f.area}</div>
                        <div>
                          <div className="font-serif text-xl text-ink-950">{f.title}</div>
                          {f.description && <p className="mt-2 text-ink-600">{f.description}</p>}
                          {f.impact && <p className="mt-2 text-sm text-ink-500">Auswirkung: {f.impact}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.solutions.length > 0 && (
                <div>
                  <h3 className="mb-6 text-xs uppercase tracking-[0.2em] text-ink-500">{t.solutions}</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    {data.solutions.map((s) => (
                      <div key={s.id} className="rounded-sm border border-ink-100 p-8">
                        <div className="font-serif text-2xl text-ink-950">{s.solution.name}</div>
                        {s.solution.description && <p className="mt-3 text-ink-600">{s.solution.description}</p>}
                        {s.solution.benefits && <p className="mt-3 text-sm text-ink-500">{s.solution.benefits}</p>}
                        {s.note && <p className="mt-3 border-l-2 border-[var(--accent)] pl-3 text-sm text-ink-700">{s.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.analyses.map((a) => (
                <div key={a.id}>
                  <h3 className="mb-6 text-xs uppercase tracking-[0.2em] text-ink-500">{t.analyses}: {a.name}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wider text-ink-500"><th className="py-2">Szenario</th><th>Mehrumsatz</th><th>Deckungsbeitrag</th><th>Einsparungen</th><th>Netto / Jahr</th><th>Amortisation</th></tr></thead>
                      <tbody>
                        {computeAll(a.inputs).map((r) => (
                          <tr key={r.upliftPct} className="border-b border-ink-100 tabular-nums">
                            <td className="py-3">+{r.upliftPct.toLocaleString("de-DE")} %</td><td>{eur(r.additionalRevenue)}</td><td>{eur(r.additionalContribution)}</td><td>{eur(r.savings)}</td><td>{eur(r.netAnnualBenefit)}</td>
                            <td>{r.paybackMonths == null ? "–" : `${r.paybackMonths.toLocaleString("de-DE")} Mon.`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {a.assumptions && <p className="mt-4 whitespace-pre-line text-sm text-ink-500">Annahmen: {a.assumptions}</p>}
                  <p className="mt-2 text-xs text-ink-400">Szenariorechnung auf Basis gemeinsam festgelegter Annahmen – keine Ergebniszusage.</p>
                </div>
              ))}
              {data.seoScan && (
                <div>
                  <h3 className="mb-6 text-xs uppercase tracking-[0.2em] text-ink-500">{t.seo}: {data.seoScan.url}</h3>
                  {data.seoScan.score != null && <div className="font-serif text-4xl">{data.seoScan.score}<span className="text-lg text-ink-400"> / 100</span></div>}
                  {data.seoScan.summary && <p className="mt-3 text-ink-600">{data.seoScan.summary}</p>}
                  <ul className="mt-4 space-y-2 text-sm">
                    {(data.seoScan.issues as { title: string; severity?: string; recommendation?: string }[]).slice(0, 12).map((i, k) => (
                      <li key={k} className="flex gap-3"><span className="w-16 shrink-0 text-xs uppercase text-ink-400">{i.severity}</span><span>{i.title}{i.recommendation && <span className="block text-ink-500">{i.recommendation}</span>}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </RoomSection>
      )}

      {m.offer && (
        <RoomSection id="offer" index={idx()} title={t.offerTitle} lead={data.offers.length ? undefined : t.offerEmpty} tone="paper">
          {data.offers.length > 0 && (
            <div className="divide-y divide-ink-200 border-y border-ink-200">
              {data.offers.map((o) => (
                <a key={o.id} href={`/room/${slug}/offers/${o.id}`} data-testid="room-offer-link" className="group flex flex-wrap items-center gap-4 py-6">
                  <div>
                    <div className="font-serif text-2xl text-ink-950 group-hover:underline">{o.title}</div>
                    <div className="text-sm text-ink-500">Angebot {o.number} · Version {o.version} · {dateDe(o.publishedAt)}{o.validUntil ? ` · gültig bis ${dateDe(o.validUntil)}` : ""}</div>
                  </div>
                  <span className="ml-auto text-sm">{o.status === "ACCEPTED" ? "Angenommen" : o.status === "DECLINED" ? "Abgelehnt" : `${t.openOffer} →`}</span>
                </a>
              ))}
            </div>
          )}
        </RoomSection>
      )}

      {m.next && (
        <RoomSection id="next" index={idx()} title={t.nextTitle}>
          <div className="grid gap-12 md:grid-cols-2">
            <div className="space-y-10">
              {data.projects.length > 0 && (
                <div>
                  <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-ink-500">{t.projects}</h3>
                  {data.projects.map((p) => <div key={p.id} className="flex justify-between border-b border-ink-100 py-3"><span>{p.name}</span><span className="text-sm text-ink-500">{({ PLANNED: "geplant", ACTIVE: "in Umsetzung", ON_HOLD: "pausiert", DONE: "abgeschlossen" } as Record<string, string>)[p.status] ?? p.status}</span></div>)}
                </div>
              )}
              <div>
                <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-ink-500">{t.documents}</h3>
                {data.documents.length ? data.documents.map((d) => (
                  <a key={d.id} href={`/api/room/${slug}/documents/${d.id}`} className="flex justify-between border-b border-ink-100 py-3 hover:text-ink-950">
                    <span>{d.name}</span><span className="text-sm text-ink-400">{Math.max(1, Math.round(d.size / 1024))} KB ↓</span>
                  </a>
                )) : <p className="text-sm text-ink-400">–</p>}
              </div>
              {data.consultant && (
                <div className="rounded-sm bg-[#f7f5f0] p-8">
                  <div className="text-xs uppercase tracking-wider text-ink-500">{t.yourContact}</div>
                  <div className="mt-2 font-serif text-2xl">{data.consultant.name}</div>
                  {data.consultant.bio && <p className="mt-3 text-sm leading-relaxed text-ink-600">{data.consultant.bio}</p>}
                  <div className="mt-4 space-y-1 text-sm">
                    <a className="block hover:underline" href={`mailto:${data.consultant.email}`}>{data.consultant.email}</a>
                    {data.consultant.phone && <a className="block hover:underline" href={`tel:${data.consultant.phone}`}>{data.consultant.phone}</a>}
                    {data.consultant.linkedinUrl && <a className="block hover:underline" href={data.consultant.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-ink-500">{t.questions}</h3>
              <div className="mb-6 max-h-80 space-y-4 overflow-y-auto">
                {data.messages.filter((x) => !x.offerId).map((msg) => (
                  <div key={msg.id} className={`max-w-[85%] rounded-sm px-4 py-3 text-sm ${msg.fromVisitor ? "ml-auto bg-[var(--primary)] text-white" : "bg-[#f7f5f0]"}`}>
                    <div className={`mb-1 text-[11px] ${msg.fromVisitor ? "text-white/60" : "text-ink-400"}`}>{msg.authorName} · {dateDe(msg.createdAt)}</div>
                    <div className="whitespace-pre-line">{msg.body}</div>
                  </div>
                ))}
              </div>
              <MessageForm slug={slug} placeholder={t.questionPlaceholder} sendLabel={t.send} defaultName={session.name} />
            </div>
          </div>
        </RoomSection>
      )}

      <footer className="border-t border-ink-100 bg-white px-6 py-10 text-xs text-ink-500">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2">
          <span>{brandName}</span>
          <span className="max-w-xl">{t.privacyNote} Kontakt: {privacy.contact}</span>
          <span className="ml-auto flex gap-4">
            {privacy.privacyUrl && <a className="underline" href={privacy.privacyUrl} target="_blank" rel="noopener noreferrer">{t.privacy}</a>}
            {privacy.imprintUrl && <a className="underline" href={privacy.imprintUrl} target="_blank" rel="noopener noreferrer">{t.imprint}</a>}
            <a className="underline" href="#consent" data-consent-open>{t.changeConsent}</a>
          </span>
        </div>
      </footer>

      <ConsentBanner slug={slug} decided={session.consentDecided} presence={session.presence} analytics={session.analytics} />
      <RoomLive slug={slug} presence={session.presence} initialFollow={session.followPresenter} />
    </div>
  );
}
