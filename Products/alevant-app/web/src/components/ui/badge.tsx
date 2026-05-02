import { cn } from "@/lib/utils";

type Tone = "neutral" | "indigo" | "brass" | "hot" | "warm" | "cold" | "success" | "error";

const tones: Record<Tone, string> = {
  neutral: "bg-bone text-smoke border-mist",
  indigo: "bg-indigo/10 text-indigo border-indigo/30",
  brass: "bg-brass/15 text-brass-deep border-brass/40",
  hot: "bg-hot/10 text-hot border-hot/30",
  warm: "bg-warm/15 text-warm border-warm/30",
  cold: "bg-cold/10 text-cold border-cold/30",
  success: "bg-success/10 text-success border-success/30",
  error: "bg-error/10 text-error border-error/30",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 text-[9px] uppercase tracking-[0.22em] font-medium border rounded-sm",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
