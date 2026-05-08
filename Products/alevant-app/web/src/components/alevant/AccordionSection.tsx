"use client";

import { useState, useEffect, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  id: string;
  title: string;
  count?: number | string;
  pulse?: boolean;
  right?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

const STORAGE_KEY_PREFIX = "alevant-acc-";

/**
 * PRAIX-style collapsible section. Each dashboard widget uses one.
 * State persists per-section via localStorage so the layout sticks.
 */
export function AccordionSection({
  id,
  title,
  count,
  pulse,
  right,
  children,
  defaultOpen = true,
  className,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + id);
      if (saved !== null) setIsOpen(saved === "1");
    } catch {}
  }, [id]);

  function toggle() {
    setIsOpen((o) => {
      const next = !o;
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + id, next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  return (
    <section className={`border border-mist bg-parchment ${className || ""}`}>
      <header
        onClick={toggle}
        className="px-6 py-4 border-b border-mist flex items-center justify-between cursor-pointer select-none hover:bg-bone/40 transition-colors"
        style={{ borderBottomWidth: isOpen ? 1 : 0 }}
      >
        <div className="flex items-center gap-3">
          {pulse && (
            <span
              className="w-2 h-2 rounded-full bg-indigo"
              style={{
                animation: "alevantPulse 2s ease-in-out infinite",
                boxShadow: "0 0 0 0 rgba(26,138,158,0.5)",
              }}
            />
          )}
          <span className="serif-display text-ink text-xl font-light">{title}</span>
          {count !== undefined && (
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-stone bg-bone border border-mist px-2 py-0.5 rounded">
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {right}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            className="text-stone hover:text-ink transition-colors p-1"
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            <ChevronDown
              className="w-4 h-4 transition-transform"
              style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
            />
          </button>
        </div>
      </header>
      {isOpen && <div>{children}</div>}
      <style>{`
        @keyframes alevantPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(26,138,158,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(26,138,158,0); }
        }
      `}</style>
    </section>
  );
}
