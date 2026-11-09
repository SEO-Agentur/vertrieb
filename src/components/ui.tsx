import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="h1">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const tones = {
  gray: "bg-ink-100 text-ink-700",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-1 ring-red-200",
  blue: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  violet: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
} as const;
export type Tone = keyof typeof tones;

export function Badge({ children, tone = "gray", title }: { children: ReactNode; tone?: Tone; title?: string }) {
  return <span title={title} className={`inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>;
}

export function InfoStatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, Tone]> = {
    VERIFIED: ["verifiziert", "green"],
    ESTIMATED: ["Schätzung", "amber"],
    HYPOTHESIS: ["Hypothese", "violet"],
    UNKNOWN: ["unbekannt", "gray"],
    CONFIRMED: ["bestätigt", "green"],
    REJECTED: ["verworfen", "red"],
  };
  const [label, tone] = map[status] ?? [status, "gray"];
  return <Badge tone={tone}>{label}</Badge>;
}

export function NotActivated({ name, detail }: { name: string; detail?: string }) {
  return (
    <div className="rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <strong>{name}: noch nicht aktiviert.</strong> {detail}
    </div>
  );
}

export function Stat({ label, value, href, hint }: { label: string; value: ReactNode; href?: string; hint?: string }) {
  const inner = (
    <div className="card-pad h-full transition hover:border-ink-300">
      <div className="text-xs font-medium text-ink-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-ink-950">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-400">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500">{children}</div>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-400">{hint}</span>}
    </label>
  );
}

export function Section({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="card">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
        <h2 className="h2">{title}</h2>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <Badge>–</Badge>;
  const tone: Tone = score >= 75 ? "green" : score >= 55 ? "blue" : "gray";
  return <Badge tone={tone}>{score}</Badge>;
}
