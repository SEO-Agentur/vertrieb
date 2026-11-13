"use client";
import Link from "next/link";
import { useState } from "react";
import { NAV } from "@/lib/site";

function Dropdown({ label, items }: { label: string; items: { href: string; label: string; text: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="flex items-center gap-1 py-2 text-sm text-site-navy hover:text-site-blue" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label} <span aria-hidden className="text-[10px]">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 w-80 rounded-lg border border-site-line bg-white p-2 shadow-xl">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="block rounded-md px-3 py-2.5 hover:bg-site-sky" onClick={() => setOpen(false)}>
              <span className="block text-sm font-semibold text-site-navy">{i.label}</span>
              <span className="block text-xs text-site-text">{i.text}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const [mobile, setMobile] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-site-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center gap-6 px-5 md:px-8">
        <Link href="/" className="flex items-center gap-4" aria-label="kivertrieb.net – Startseite">
          <span className="text-2xl font-extrabold tracking-tight text-site-navy">kivertrieb<span className="text-site-blue">.net</span></span>
          <span className="hidden border-l border-site-line pl-4 text-[11px] leading-tight text-site-text lg:block">Vertrieb. Prozesse. KI.<br />Für Kleinbetriebe und Mittelstand.</span>
        </Link>
        <nav aria-label="Hauptnavigation" className="ml-auto hidden items-center gap-7 md:flex">
          <Dropdown label="Leistungen" items={NAV.leistungen} />
          <Dropdown label="Anwendungsfälle" items={NAV.anwendungsfaelle} />
          <Link href="/preise" className="text-sm text-site-navy hover:text-site-blue">Preise</Link>
          <Link href="/ueber-mich" className="text-sm text-site-navy hover:text-site-blue">Über mich</Link>
          <Link href="/kontakt" className="inline-flex items-center gap-2 rounded bg-site-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-site-blue">Kontakt <span aria-hidden>→</span></Link>
        </nav>
        <button type="button" className="ml-auto rounded border border-site-line px-3 py-2 text-sm md:hidden" aria-expanded={mobile} aria-controls="mobile-nav" onClick={() => setMobile((m) => !m)}>Menü</button>
      </div>
      {mobile && (
        <nav id="mobile-nav" aria-label="Mobile Navigation" className="border-t border-site-line bg-white px-5 py-4 md:hidden">
          {[...NAV.leistungen, ...NAV.anwendungsfaelle, { href: "/ueber-mich", label: "Über mich", text: "" }, { href: "/kontakt", label: "Kontakt", text: "" }].map((i) => (
            <Link key={i.href} href={i.href} className="block py-2.5 text-site-navy" onClick={() => setMobile(false)}>{i.label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
