"use client";

import { X, RotateCcw, Bold, Italic } from "lucide-react";
import {
  DASH_PRESETS,
  type DashboardTheme,
} from "./useDashboardTheme";

interface Props {
  dashboardId: string;
  theme: DashboardTheme;
  onChange: (t: DashboardTheme) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const FONT = "'Jost', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";
const ACCENT = "#1A8A9E"; // ALEVANT teal

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span style={{ fontFamily: FONT, fontSize: 11, color: "#999", fontWeight: 300 }}>
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 border-0 bg-transparent cursor-pointer p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 76,
            fontFamily: MONO,
            fontSize: 10,
            padding: "3px 6px",
            background: "#1A1A1A",
            border: "1px solid #333",
            borderRadius: 4,
            color: "#ccc",
            textAlign: "center",
          }}
        />
      </div>
    </div>
  );
}

export function DashboardCustomizer({
  theme,
  onChange,
  onReset,
  isOpen,
  onClose,
}: Props) {
  if (!isOpen) return null;

  function applyPreset(key: string) {
    const p = DASH_PRESETS[key];
    if (p) onChange({ ...p.theme, fontSize: theme.fontSize });
  }

  function update<K extends keyof DashboardTheme>(field: K, value: DashboardTheme[K]) {
    onChange({ ...theme, [field]: value });
  }

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-[9998] backdrop-blur-sm"
      />
      <div
        className="fixed top-0 right-0 bottom-0 w-[340px] z-[9999] overflow-y-auto"
        style={{
          background: "#111",
          borderLeft: "1px solid #222",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between">
          <div>
            <div
              className="text-[9px] uppercase"
              style={{
                fontFamily: MONO,
                letterSpacing: "0.22em",
                color: "#666",
              }}
            >
              Customize
            </div>
            <div className="mt-0.5" style={{ fontFamily: FONT, fontSize: 14, color: "#eee" }}>
              Cockpit Theme
            </div>
          </div>
          <button
            onClick={onClose}
            className="border border-[#333] rounded-md text-[#999] px-2 py-1 hover:border-[#666]"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Presets */}
        <div className="px-5 py-4 border-b border-[#222]">
          <div
            className="text-[9px] uppercase mb-2.5"
            style={{ fontFamily: MONO, letterSpacing: "0.18em", color: "#666" }}
          >
            Presets
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(DASH_PRESETS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors"
                style={{
                  background: "#1A1A1A",
                  border: "1px solid #333",
                  fontFamily: FONT,
                  fontSize: 11,
                  color: "#ccc",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = ACCENT;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#333";
                }}
              >
                <span
                  className="inline-block w-3.5 h-3.5 rounded-sm"
                  style={{
                    background: p.theme.bg,
                    border: `1px solid ${p.theme.border}`,
                  }}
                />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="px-5 py-4 border-b border-[#222]">
          <div
            className="text-[9px] uppercase mb-2.5"
            style={{ fontFamily: MONO, letterSpacing: "0.18em", color: "#666" }}
          >
            Colors
          </div>
          <ColorInput label="Background" value={theme.bg} onChange={(v) => update("bg", v)} />
          <ColorInput label="Card" value={theme.card} onChange={(v) => update("card", v)} />
          <ColorInput label="Border" value={theme.border} onChange={(v) => update("border", v)} />
          <ColorInput label="Text" value={theme.text} onChange={(v) => update("text", v)} />
          <ColorInput label="Muted" value={theme.muted} onChange={(v) => update("muted", v)} />
          <ColorInput label="Accent" value={theme.accent} onChange={(v) => update("accent", v)} />
        </div>

        {/* Font Style */}
        <div className="px-5 py-4 border-b border-[#222]">
          <div
            className="text-[9px] uppercase mb-2.5"
            style={{ fontFamily: MONO, letterSpacing: "0.18em", color: "#666" }}
          >
            Font Style
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => update("fontBold", !theme.fontBold)}
              className="flex-1 py-2 rounded-md border flex items-center justify-center gap-1.5"
              style={{
                background: theme.fontBold ? ACCENT : "#1A1A1A",
                borderColor: theme.fontBold ? ACCENT : "#333",
                color: theme.fontBold ? "#fff" : "#999",
                fontFamily: FONT,
                fontSize: 11,
              }}
            >
              <Bold className="w-3 h-3" /> Bold
            </button>
            <button
              onClick={() => update("fontItalic", !theme.fontItalic)}
              className="flex-1 py-2 rounded-md border flex items-center justify-center gap-1.5"
              style={{
                background: theme.fontItalic ? ACCENT : "#1A1A1A",
                borderColor: theme.fontItalic ? ACCENT : "#333",
                color: theme.fontItalic ? "#fff" : "#999",
                fontFamily: FONT,
                fontSize: 11,
                fontStyle: "italic",
              }}
            >
              <Italic className="w-3 h-3" /> Italic
            </button>
          </div>
        </div>

        {/* Font size */}
        <div className="px-5 py-4 border-b border-[#222]">
          <div
            className="text-[9px] uppercase mb-2.5"
            style={{ fontFamily: MONO, letterSpacing: "0.18em", color: "#666" }}
          >
            Font Size · {Math.round(theme.fontSize * 100)}%
          </div>
          <input
            type="range"
            min={0.8}
            max={1.5}
            step={0.05}
            value={theme.fontSize}
            onChange={(e) => update("fontSize", parseFloat(e.target.value))}
            className="w-full"
            style={{ accentColor: ACCENT }}
          />
          <div className="flex gap-1.5 mt-2">
            {[0.85, 0.9, 1, 1.1, 1.2, 1.35].map((s) => {
              const active = Math.abs(theme.fontSize - s) < 0.01;
              return (
                <button
                  key={s}
                  onClick={() => update("fontSize", s)}
                  className="flex-1 py-1 rounded border"
                  style={{
                    background: active ? ACCENT : "#1A1A1A",
                    borderColor: active ? ACCENT : "#333",
                    color: active ? "#fff" : "#999",
                    fontFamily: MONO,
                    fontSize: 9,
                  }}
                >
                  {Math.round(s * 100)}%
                </button>
              );
            })}
          </div>
        </div>

        {/* Reset */}
        <div className="px-5 py-4">
          <button
            onClick={onReset}
            className="w-full py-2.5 rounded-md border border-[#333] flex items-center justify-center gap-2 hover:border-[#666] transition-colors"
            style={{
              fontFamily: FONT,
              fontSize: 11,
              color: "#999",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            <RotateCcw className="w-3 h-3" /> Reset to Editorial
          </button>
        </div>
      </div>
    </>
  );
}
