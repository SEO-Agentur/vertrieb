import Link from "next/link";
import { NAV, APP_URL_PUBLIC } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-site-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-4 md:px-8">
        <div className="md:col-span-1">
          <p className="text-xl font-extrabold text-site-navy">kivertrieb<span className="text-site-blue">.net</span></p>
          <p className="mt-3 text-sm text-site-text">KI im Vertrieb – gemeinsam herausfinden, was sich lohnt. Beratung und Plattform für B2B-Unternehmen.</p>
        </div>
        <div>
          <p className="text-sm font-bold text-site-navy">Leistungen</p>
          <ul className="mt-3 space-y-2 text-sm">{NAV.leistungen.map((i) => <li key={i.href}><Link className="text-site-text hover:text-site-blue" href={i.href}>{i.label}</Link></li>)}</ul>
        </div>
        <div>
          <p className="text-sm font-bold text-site-navy">Wissen & Werkzeuge</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="text-site-text hover:text-site-blue" href="/">KI im Vertrieb</Link></li>
            {NAV.anwendungsfaelle.map((i) => <li key={i.href}><Link className="text-site-text hover:text-site-blue" href={i.href}>{i.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold text-site-navy">Unternehmen</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="text-site-text hover:text-site-blue" href="/ueber-mich">Über mich</Link></li>
            <li><Link className="text-site-text hover:text-site-blue" href="/kontakt">Kontakt</Link></li>
            <li><a className="text-site-text hover:text-site-blue" href={`${APP_URL_PUBLIC}/login`}>Login Plattform</a></li>
            <li><Link className="text-site-text hover:text-site-blue" href="/impressum">Impressum</Link></li>
            <li><Link className="text-site-text hover:text-site-blue" href="/datenschutz">Datenschutz</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-site-line py-5 text-center text-xs text-site-text">© {new Date().getFullYear()} kivertrieb.net · Alle Berechnungen sind Beispiele auf Basis offengelegter Annahmen, keine Ergebniszusagen.</div>
    </footer>
  );
}
