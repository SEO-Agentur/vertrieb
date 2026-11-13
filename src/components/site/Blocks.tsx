import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "./JsonLd";
import { SITE_URL } from "@/lib/site";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 md:px-8 ${className}`}>{children}</div>;
}

export function Rule() {
  return <span aria-hidden className="mt-4 block h-1 w-12 rounded bg-site-blue" />;
}

export function SectionTitle({ eyebrow, title, children, as = "h2" }: { eyebrow?: string; title: ReactNode; children?: ReactNode; as?: "h1" | "h2" }) {
  const H = as;
  return (
    <div>
      {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-site-blue">{eyebrow}</p>}
      <H className={`${as === "h1" ? "text-4xl md:text-5xl" : "text-3xl md:text-[2.1rem]"} font-extrabold leading-[1.1] tracking-tight text-site-navy`}>{title}</H>
      <Rule />
      {children && <div className="mt-5 max-w-xl text-[15px] leading-relaxed text-site-text">{children}</div>}
    </div>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "outline" | "light" }) {
  const cls = {
    primary: "bg-site-blue text-white hover:bg-site-bluedark",
    outline: "border border-white/70 text-white hover:bg-white/10",
    light: "border border-site-line bg-white text-site-navy hover:border-site-blue",
  }[variant];
  return (
    <Link href={href} className={`inline-flex items-center gap-2 rounded px-5 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-site-blue focus-visible:ring-offset-2 ${cls}`}>
      {children} <span aria-hidden>→</span>
    </Link>
  );
}

export function PageHero({ eyebrow, title, intro, crumbs }: { eyebrow: string; title: string; intro: ReactNode; crumbs: { href: string; label: string }[] }) {
  return (
    <section className="relative overflow-hidden bg-site-deep text-white">
      <ArchLines />
      <Container className="relative py-14 md:py-20">
        <nav aria-label="Brotkrümelnavigation" className="mb-6 text-xs text-white/60">
          <Link href="/" className="hover:text-white">Start</Link>
          {crumbs.map((c) => (
            <span key={c.href}> / <Link href={c.href} className="hover:text-white">{c.label}</Link></span>
          ))}
        </nav>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">{eyebrow}</p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl">{title}</h1>
        <span aria-hidden className="mt-5 block h-1 w-12 rounded bg-site-blue" />
        <div className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/85">{intro}</div>
      </Container>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Start", item: `${SITE_URL}/` }, ...crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 2, name: c.label, item: `${SITE_URL}${c.href}` }))] }} />
    </section>
  );
}

/** Abstrakte Architektur-Linien als Hintergrund (statt Stockfotos). */
export function ArchLines({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full opacity-[0.18] ${className}`} viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="al" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity="0.9" /></linearGradient>
      </defs>
      {Array.from({ length: 14 }).map((_, i) => <line key={`v${i}`} x1={700 + i * 38} y1="0" x2={640 + i * 46} y2="500" stroke="url(#al)" strokeWidth="1" />)}
      {Array.from({ length: 9 }).map((_, i) => <line key={`h${i}`} x1="560" y1={60 + i * 50} x2="1200" y2={30 + i * 56} stroke="url(#al)" strokeWidth="0.8" />)}
      <path d="M520 500 L760 0" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" />
    </svg>
  );
}

export function Summary({ points }: { points: string[] }) {
  return (
    <aside className="rounded-lg border border-site-line bg-site-sky p-6">
      <p className="text-sm font-bold text-site-navy">Kurz zusammengefasst</p>
      <ul className="mt-3 space-y-2 text-[15px] text-site-text">{points.map((p) => <li key={p} className="flex gap-2"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-site-blue" />{p}</li>)}</ul>
    </aside>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div>
      <div className="divide-y divide-site-line rounded-lg border border-site-line bg-white">
        {items.map((f) => (
          <details key={f.q} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-site-navy">
              {f.q}<span aria-hidden className="text-site-blue transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-site-text">{f.a}</p>
          </details>
        ))}
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
    </div>
  );
}

export function CtaBand({ title = "Was wäre möglich, wenn Ihr Vertrieb intelligenter arbeiten würde?", text = "Lassen Sie uns gemeinsam herausfinden, welches Potenzial in Ihrem Vertrieb steckt – konkret, strukturiert und auf Ihr Unternehmen zugeschnitten." }: { title?: string; text?: string }) {
  return (
    <section className="relative overflow-hidden bg-site-deep text-white">
      <ArchLines />
      <Container className="relative grid gap-8 py-14 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">{title}</p>
          <span aria-hidden className="mt-5 block h-1 w-12 rounded bg-site-blue" />
        </div>
        <div className="md:border-l md:border-white/20 md:pl-10">
          <p className="text-white/85">{text}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/potenzialanalyse#anfrage">Kostenloses Potenzialgespräch vereinbaren</ButtonLink>
            <ButtonLink href="/plattform" variant="outline">Plattform ansehen</ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="space-y-4 text-[16px] leading-relaxed text-site-text [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-site-navy [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-site-navy [&_a]:text-site-blue [&_a]:underline [&_strong]:text-site-navy [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">{children}</div>;
}

export function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-site-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-site-sky text-site-navy"><tr>{head.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-site-line bg-white">{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={`px-4 py-3 align-top ${j === 0 ? "font-medium text-site-navy" : "text-site-text"}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
