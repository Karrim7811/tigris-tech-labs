"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutDashboard,
  Inbox,
  Home,
  Users,
  Calculator,
  Sparkles,
  Phone,
  Grid3x3,
  FileText,
  Building2,
  Settings,
  CircleUser,
  Heart,
  Newspaper,
  ChevronDown,
  ChevronRight,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  LogOut,
  Shield,
} from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { AskAlevant } from "./AskAlevant";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}
interface NavGroup {
  label: string;
  color: string;
  items: NavItem[];
}

// ALEVANT product accent — TTL palette teal (sibling to PRAIX terra)
const ACCENT = "#1A8A9E";        // TTL teal — primary product accent
const ACCENT_GLOW = "rgba(26, 138, 158, 0.13)";
const ACCENT_BORDER = "rgba(26, 138, 158, 0.30)";
const TERRA = "#C4875A";         // warm secondary (TTL palette)
const BRASS = "#B5853E";

const GROUPS: NavGroup[] = [
  {
    label: "Core",
    color: ACCENT,
    items: [
      { href: "/cockpit", label: "Cockpit", icon: LayoutDashboard },
      { href: "/inbox", label: "Lead Inbox", icon: Inbox },
      { href: "/listings", label: "Listings", icon: Home },
    ],
  },
  {
    label: "Pipelines",
    color: TERRA,
    items: [
      { href: "/pipelines/buyer", label: "Buyers", icon: Users },
      { href: "/pipelines/seller", label: "Sellers", icon: Building2 },
      { href: "/pipelines/investor", label: "Investors", icon: Calculator },
      { href: "/pipelines/rental", label: "Rentals", icon: Heart },
    ],
  },
  {
    label: "Intelligence",
    color: BRASS,
    items: [
      { href: "/news", label: "News & Intel", icon: Newspaper },
      { href: "/grid", label: "The Grid", icon: Grid3x3 },
      { href: "/sphere", label: "Sphere", icon: CircleUser },
      { href: "/underwriter", label: "Underwriter", icon: Calculator },
    ],
  },
  {
    label: "AI Personas",
    color: ACCENT,
    items: [
      { href: "/sofia", label: "Sofia", icon: Phone },
      { href: "/vesper", label: "Vesper", icon: Sparkles },
    ],
  },
  {
    label: "Operations",
    color: "#9A8FBF",
    items: [
      { href: "/transactions", label: "Transactions", icon: FileText },
      { href: "/admin", label: "Admin", icon: Shield },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const BG = "#1A1915";
const BORDER = "#2A2820";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<string, boolean>>(
    Object.fromEntries(GROUPS.map((g) => [g.label, true]))
  );
  const [collapsed, setCollapsed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const closeAsk = useCallback(() => setAskOpen(false), []);

  // Cmd/Ctrl-K opens Ask
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAskOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleGroup(label: string) {
    setOpen((p) => ({ ...p, [label]: !p[label] }));
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  }

  async function signOut() {
    const sb = getSupabaseBrowser();
    await sb.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isMac = useMemo(
    () => typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent),
    []
  );

  const sidebarWidth = 240;

  return (
    <>
      <AskAlevant open={askOpen} onClose={closeAsk} />

      {/* Re-open button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="fixed top-4 left-3 z-[51] flex items-center justify-center px-2 py-1.5 rounded-md transition-colors"
          style={{ background: BG, color: "#7A7068", border: `1px solid ${BORDER}` }}
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}

      <aside
        className="fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden transition-transform duration-200"
        style={{
          width: sidebarWidth,
          background: BG,
          borderRight: `1px solid ${BORDER}`,
          transform: collapsed ? "translateX(-100%)" : "translateX(0)",
        }}
      >
        {/* ── Brand block ─────────────────────────────────── */}
        <div
          className="flex items-start justify-between px-4 pt-4 pb-3"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <Link href="/cockpit" className="block group">
            {/*  TTL signature wordmark:
                 - lowercase italic Cormorant
                 - dot above first 'a' (TTL master pattern)
                 - final 't' in accent (PRAIX-style product letter)  */}
            <div
              className="font-light text-[30px] leading-none italic relative inline-block text-parchment"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.01em" }}
            >
              alevan
              <span style={{ color: ACCENT }}>t</span>
              {/* TTL signature dot above first 'a' */}
              <span
                className="absolute"
                style={{
                  top: 4,
                  left: 2,
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: ACCENT,
                }}
              />
            </div>
            <div
              className="text-[9px] uppercase mt-2"
              style={{
                letterSpacing: "0.32em",
                color: ACCENT,
                fontFamily: "'Jost', sans-serif",
              }}
            >
              AI Operating System
            </div>
            <div
              className="text-[8px] uppercase mt-1"
              style={{
                letterSpacing: "0.28em",
                color: "#5A5750",
                fontFamily: "'Jost', sans-serif",
              }}
            >
              A Tigris Tech Labs Product
            </div>
          </Link>
          <div className="flex gap-1.5 mt-1 flex-shrink-0">
            <button
              onClick={toggleFullscreen}
              className="border rounded-md px-1.5 py-1 transition-colors flex items-center justify-center"
              style={{ background: "none", borderColor: BORDER, color: "#7A7068" }}
              title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {fullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setCollapsed(true)}
              className="border rounded-md px-1.5 py-1 transition-colors flex items-center justify-center"
              style={{ background: "none", borderColor: BORDER, color: "#7A7068" }}
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ── Ask alevant button (Cmd-K) ──────────────────── */}
        <div className="px-3 pt-3">
          <button
            onClick={() => setAskOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md transition-colors"
            style={{
              background: ACCENT_GLOW,
              border: `1px solid ${ACCENT_BORDER}`,
              color: "#FAFAF8",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(26,138,158,0.22)";
              e.currentTarget.style.borderColor = "rgba(26,138,158,0.50)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = ACCENT_GLOW;
              e.currentTarget.style.borderColor = ACCENT_BORDER;
            }}
          >
            <Search className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span
              className="flex-1 text-left text-xs font-normal"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              Ask alevant…
            </span>
            <span
              className="text-[9px] px-2 py-0.5 rounded"
              style={{
                background: "rgba(26,138,158,0.20)",
                color: ACCENT,
                letterSpacing: "0.05em",
              }}
            >
              {isMac ? "⌘K" : "Ctrl K"}
            </span>
          </button>
        </div>

        {/* ── Nav ─────────────────────────────────────────── */}
        <nav
          className="flex-1 overflow-y-auto py-2"
          style={{ scrollbarWidth: "none" }}
        >
          {GROUPS.map((g) => {
            const isOpen = open[g.label];
            const hasActive = g.items.some(
              (i) => pathname === i.href || (i.href !== "/cockpit" && pathname.startsWith(i.href))
            );
            return (
              <div key={g.label} className="mb-1">
                <button
                  onClick={() => toggleGroup(g.label)}
                  className="w-full flex items-center gap-2 px-4 py-1.5 bg-transparent border-0 cursor-pointer text-left"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: hasActive ? g.color : "#3A3730" }}
                  />
                  <span
                    className="text-[10px] flex-1 uppercase"
                    style={{
                      letterSpacing: "0.22em",
                      color: hasActive ? g.color : "#7A7068",
                      fontFamily: "'Jost', sans-serif",
                    }}
                  >
                    {g.label}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="w-2.5 h-2.5" style={{ color: "#5A5750" }} />
                  ) : (
                    <ChevronRight className="w-2.5 h-2.5" style={{ color: "#5A5750" }} />
                  )}
                </button>
                {isOpen && (
                  <ul className="mt-0.5">
                    {g.items.map((it) => {
                      const active =
                        pathname === it.href ||
                        (it.href !== "/cockpit" && pathname.startsWith(it.href));
                      return (
                        <li key={it.href}>
                          <Link
                            href={it.href}
                            className="flex items-center gap-2.5 px-4 py-1.5 transition-colors text-[12.5px]"
                            style={{
                              color: active ? "#FAFAF8" : "rgba(250,250,248,0.62)",
                              background: active ? "rgba(26,138,158,0.10)" : "transparent",
                              fontFamily: "'Jost', sans-serif",
                              fontWeight: active ? 500 : 300,
                              borderLeft: active ? `2px solid ${ACCENT}` : "2px solid transparent",
                            }}
                          >
                            <it.icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span>{it.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Footer block ────────────────────────────────── */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderTop: `1px solid ${BORDER}` }}
        >
          <div className="text-[9px] uppercase" style={{ letterSpacing: "0.22em", color: "#5A5750" }}>
            A Tigris Tech Labs Product
          </div>
          <button
            onClick={signOut}
            className="border rounded-md px-1.5 py-1 transition-colors flex items-center justify-center"
            style={{ background: "none", borderColor: BORDER, color: "#7A7068" }}
            title="Sign out"
          >
            <LogOut className="w-3 h-3" />
          </button>
        </div>
      </aside>
    </>
  );
}
