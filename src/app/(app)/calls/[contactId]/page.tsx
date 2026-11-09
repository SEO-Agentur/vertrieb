import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadCallScript } from "@/lib/call-script-store";
import { aiStatus } from "@/lib/ai/provider";
import { millions, dateTime } from "@/lib/format";
import { CallWorkspace } from "../CallWorkspace";

export const metadata = { title: "Telefonat" };

export default async function CallPage({ params }: { params: Promise<{ contactId: string }> }) {
  const user = await requireUser();
  const { contactId } = await params;
  const contact = await db.contact.findFirst({ where: { id: contactId, tenantId: user.tenantId }, include: { company: { include: { room: { select: { id: true } } } } } });
  if (!contact) notFound();
  const [script, hyps, activities] = await Promise.all([
    loadCallScript(user.tenantId),
    db.improvementHypothesis.findMany({ where: { companyId: contact.companyId, reviewed: true, status: { not: "REJECTED" } }, orderBy: { order: "asc" }, take: 5 }),
    db.activity.findMany({ where: { companyId: contact.companyId }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const topics = hyps.map((h) => h.topic);
  const c = contact.company;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xs text-ink-400"><Link href="/calls" className="hover:underline">Telefonate</Link> / {contact.firstName} {contact.lastName}</div>
        <Link href="/settings?tab=callscript" className="text-xs text-ink-500 underline">Leitfaden bearbeiten</Link>
      </div>
      <CallWorkspace
        contact={{ id: contact.id, firstName: contact.firstName, lastName: contact.lastName, title: contact.title, phone: contact.phone, email: contact.email, linkedinUrl: contact.linkedinUrl }}
        company={{ id: c.id, name: c.name, industry: c.industry, location: c.location, revenue: millions(c.revenueEur), hasRoom: !!c.room }}
        script={script}
        vars={{ firstName: contact.firstName, lastName: contact.lastName, company: c.name, industry: c.industry ?? "B2B", topic: topics[0] ?? "Neukundengewinnung und Angebotserstellung", consultant: user.name }}
        topics={topics}
        history={activities.map((a) => ({ id: a.id, title: a.title, body: a.body, date: dateTime(a.createdAt) }))}
        aiEnabled={aiStatus().enabled}
      />
    </div>
  );
}
