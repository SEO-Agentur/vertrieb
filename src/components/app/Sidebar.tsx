"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/login/actions";

const NAV: { group: string; items: [string, string][] }[] = [
  { group: "", items: [["/dashboard", "Dashboard"]] },
  { group: "Gewinnung", items: [["/prospecting", "Prospecting"], ["/companies", "Unternehmen"], ["/contacts", "Ansprechpartner"], ["/qualification", "Qualifizierung"], ["/research", "Unternehmensrecherche"]] },
  { group: "Ansprache", items: [["/rooms", "Kundenwelten"], ["/outreach", "Outreach"], ["/activities", "Aktivitäten"], ["/live", "Live-Besucher"], ["/meetings", "Videogespräche"]] },
  { group: "Beratung", items: [["/analyses", "Potenzialanalysen"], ["/catalog", "Lösungen"], ["/offers", "Angebote"]] },
  { group: "Steuerung", items: [["/pipeline", "Sales-Pipeline"], ["/tasks", "Aufgaben"], ["/reports", "Auswertungen"], ["/settings", "Einstellungen"]] },
];

export function Sidebar({ user }: { user: { name: string; role: string } }) {
  const path = usePathname();
  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-ink-200 bg-white">
      <div className="px-5 py-4">
        <div className="font-serif text-lg leading-tight text-ink-950">Sales Command</div>
        <div className="text-[11px] uppercase tracking-widest text-ink-400">Center</div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((g) => (
          <div key={g.group} className="mb-3">
            {g.group && <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-ink-400">{g.group}</div>}
            {g.items.map(([href, label]) => {
              const active = path === href || path.startsWith(href + "/");
              return (
                <Link key={href} href={href} className={`block rounded-md px-2 py-1.5 text-sm ${active ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-100"}`}>
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-ink-100 px-5 py-3 text-xs">
        <div className="font-medium text-ink-800">{user.name}</div>
        <div className="text-ink-400">{user.role}</div>
        <form action={logoutAction}><button className="mt-2 text-ink-500 underline">Abmelden</button></form>
      </div>
    </aside>
  );
}
