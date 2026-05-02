import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface StageShellProps {
  stage: number;
  total?: number;
  title: string;
  intro: string;
  prevHref?: string;
  nextHref?: string;
  nextLabel?: string;
  children: React.ReactNode;
}

export function StageShell({
  stage,
  total = 9,
  title,
  intro,
  prevHref,
  nextHref,
  nextLabel = "Continue",
  children,
}: StageShellProps) {
  return (
    <div className="max-w-3xl">
      <p className="eyebrow !text-indigo mb-3">
        Stage {String(stage).padStart(2, "0")} of {String(total).padStart(2, "0")}
      </p>
      <h1 className="serif-display text-ink text-5xl mb-4 leading-tight">{title}</h1>
      <p className="text-base text-smoke leading-relaxed mb-12 max-w-2xl">{intro}</p>
      <div className="space-y-8">{children}</div>
      <div className="flex items-center justify-between mt-16 pt-8 border-t border-mist">
        {prevHref ? (
          <Link href={prevHref}>
            <Button variant="ghost" size="md">← Back</Button>
          </Link>
        ) : <span />}
        {nextHref && (
          <Link href={nextHref}>
            <Button size="md">{nextLabel} →</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-normal uppercase tracking-[0.22em] text-stone mb-2">
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs text-stone leading-relaxed">{hint}</p>}
    </div>
  );
}
