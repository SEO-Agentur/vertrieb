"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { moveStage } from "../companies/actions";

type Card = { id: string; name: string; score: number | null; dealValue: number | null; stageId: string | null; industry: string | null };
type Stage = { id: string; name: string; color: string };

export function Kanban({ stages, cards: initial }: { stages: Stage[]; cards: Card[] }) {
  const [cards, setCards] = useState(initial);
  const [drag, setDrag] = useState<string | null>(null);
  const [pending, start] = useTransition();
  function drop(stageId: string) {
    if (!drag) return;
    const id = drag;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, stageId } : c)));
    setDrag(null);
    start(() => moveStage(id, stageId));
  }
  return (
    <div className={`flex gap-3 overflow-x-auto pb-4 ${pending ? "opacity-80" : ""}`}>
      {stages.map((s) => {
        const list = cards.filter((c) => c.stageId === s.id);
        return (
          <div key={s.id} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(s.id)} className="flex w-60 shrink-0 flex-col rounded-lg bg-ink-100/70">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-ink-700"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}<span className="ml-auto text-ink-400">{list.length}</span></div>
            <div className="flex min-h-24 flex-col gap-2 px-2 pb-2">
              {list.map((c) => (
                <div key={c.id} draggable onDragStart={() => setDrag(c.id)} className="cursor-grab rounded-md border border-ink-200 bg-white p-2.5 text-sm shadow-sm active:cursor-grabbing">
                  <Link href={`/companies/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                  <div className="mt-1 flex justify-between text-[11px] text-ink-500"><span>{c.industry ?? ""}</span><span>{c.score ?? "–"}</span></div>
                  {c.dealValue != null && <div className="text-[11px] text-ink-600">{c.dealValue.toLocaleString("de-DE")} €</div>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
