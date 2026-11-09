"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function OfferLiveButton({ roomId }: { roomId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <button
      className="btn-secondary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await fetch("/api/live/offer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ roomId }) });
        setBusy(false);
        if (res.ok) router.push(`/meetings/${(await res.json()).meetingId}`);
      }}
    >
      Live-Gespräch anbieten
    </button>
  );
}
