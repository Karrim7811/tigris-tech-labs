"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QueueItem {
  id: string;
  asset_type: string;
  channel?: string;
  status: string;
  scheduled_for?: string;
  listing_id?: string;
  listing_address?: string;
}

const STATUS_ICONS: Record<string, typeof Clock> = {
  generating: Clock,
  awaiting_approval: AlertCircle,
  approved: CheckCircle2,
  published: CheckCircle2,
};

export function QueueClient({ items }: { items: QueueItem[] }) {
  const [list, setList] = useState(items);
  const [pending, startTransition] = useTransition();

  function update(id: string, status: string) {
    setList((curr) => curr.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  async function approve(id: string) {
    update(id, "approved");
    startTransition(async () => {
      const r = await fetch(`/api/vesper/approve/${id}`, { method: "POST" });
      const json = await r.json().catch(() => ({}));
      if (!r.ok && json?.error === "fair_housing_block") {
        update(id, "awaiting_approval");
        alert(`Fair Housing block: ${(json.findings || []).map((f: any) => f.term).join(", ")}`);
      }
    });
  }

  async function reject(id: string) {
    const reason = window.prompt("Reason (optional)") || "";
    update(id, "rejected");
    startTransition(async () => {
      await fetch(`/api/vesper/reject/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason }),
      });
    });
  }

  return (
    <div className="border border-mist bg-parchment">
      {list.map((q) => {
        const Icon = STATUS_ICONS[q.status] || Clock;
        return (
          <div
            key={q.id}
            className="grid grid-cols-[40px_1fr_120px_140px_220px] gap-4 px-5 py-5 items-center border-b border-mist last:border-b-0"
          >
            <Icon className="w-4 h-4 text-stone" />
            <div>
              <p className="text-sm text-ink font-medium">
                {q.listing_address ? `${q.listing_address} — ` : ""}{q.asset_type.replace(/_/g, " ")}
              </p>
              <p className="text-xs text-stone mt-1">{q.status.replace(/_/g, " ")}</p>
            </div>
            <Badge tone="neutral">{q.channel || "multi"}</Badge>
            <p className="text-xs text-stone">{q.scheduled_for || "—"}</p>
            <div className="flex gap-2 justify-end">
              {q.status === "awaiting_approval" && (
                <>
                  <button
                    onClick={() => approve(q.id)}
                    disabled={pending}
                    className="btn-base bg-indigo text-parchment hover:bg-indigo-deep !px-3 !py-2 !text-[9px]"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(q.id)}
                    disabled={pending}
                    className="btn-base bg-bone text-ink border border-mist hover:bg-mist !px-3 !py-2 !text-[9px]"
                  >
                    Reject
                  </button>
                </>
              )}
              {q.status === "approved" && <span className="text-xs text-success uppercase tracking-[0.22em]">Approved · publishing</span>}
              {q.status === "published" && <span className="text-xs text-success uppercase tracking-[0.22em]">Published</span>}
              {q.status === "rejected" && <span className="text-xs text-error uppercase tracking-[0.22em]">Rejected</span>}
              {q.status === "generating" && <span className="text-xs text-warm uppercase tracking-[0.22em]">Generating…</span>}
            </div>
          </div>
        );
      })}
      {!list.length && (
        <p className="px-5 py-12 text-center text-sm text-stone">
          Nothing in queue. Vesper auto-generates a campaign when a listing transitions to Active.
        </p>
      )}
    </div>
  );
}
