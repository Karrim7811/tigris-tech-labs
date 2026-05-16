"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { STAGE_LABEL, stagesForSide, type OppStage, type OppSide } from "@/lib/opp-stages";

export function StagePicker({
  opportunityId,
  side,
  currentStage,
}: {
  opportunityId: string;
  side: OppSide;
  currentStage: OppStage;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<OppStage>(currentStage);
  const [submitting, setSubmitting] = useState(false);
  const [askingLossReason, setAskingLossReason] = useState(false);
  const [lossReason, setLossReason] = useState("");

  const stages = stagesForSide(side);

  async function moveTo(to: OppStage, reason?: string) {
    if (to === "lost" && !reason) {
      setAskingLossReason(true);
      return;
    }
    setSubmitting(true);
    try {
      await fetch(`/api/opportunities/${opportunityId}/stage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to_stage: to, loss_reason: reason }),
      });
      setStage(to);
      setAskingLossReason(false);
      setLossReason("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {stages.map((s) => (
          <button
            key={s}
            onClick={() => moveTo(s)}
            disabled={submitting || s === stage}
            className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
              s === stage
                ? "bg-indigo text-parchment border-indigo"
                : s === "won"
                ? "bg-parchment text-indigo border-indigo hover:bg-indigo hover:text-parchment"
                : s === "lost"
                ? "bg-parchment text-stone border-mist hover:border-hot hover:text-hot"
                : "bg-parchment text-stone border-mist hover:border-indigo hover:text-ink"
            }`}
          >
            {submitting && s === stage && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
            {s === stage && !submitting && <Check className="w-3 h-3 inline mr-1" />}
            {STAGE_LABEL[s]}
          </button>
        ))}
      </div>

      {askingLossReason && (
        <div className="mt-3 p-3 border border-hot/50 bg-hot/5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-hot mb-2">Why lost?</p>
          <input
            value={lossReason}
            onChange={(e) => setLossReason(e.target.value)}
            placeholder="e.g. went with another agent, price, timing…"
            className="w-full px-3 py-2 text-sm bg-parchment border border-mist focus:outline-none focus:border-hot"
            autoFocus
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => moveTo("lost", lossReason)}
              disabled={submitting || !lossReason.trim()}
              className="px-3 py-1.5 text-xs uppercase tracking-[0.28em] bg-hot text-parchment hover:opacity-90 disabled:opacity-50"
            >
              Mark lost
            </button>
            <button
              onClick={() => {
                setAskingLossReason(false);
                setLossReason("");
              }}
              className="text-xs uppercase tracking-[0.28em] text-stone hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
