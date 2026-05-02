import Link from "next/link";
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
} from "lucide-react";
import { Wordmark } from "@/components/alevant/wordmark";
import { cn } from "@/lib/utils";

const NAV: { group: string; items: { href: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    group: "Core",
    items: [
      { href: "/cockpit", label: "Cockpit", icon: LayoutDashboard },
      { href: "/inbox", label: "Lead Inbox", icon: Inbox },
      { href: "/listings", label: "Listings", icon: Home },
    ],
  },
  {
    group: "Pipelines",
    items: [
      { href: "/pipelines/buyer", label: "Buyers", icon: Users },
      { href: "/pipelines/seller", label: "Sellers", icon: Building2 },
      { href: "/pipelines/investor", label: "Investors", icon: Calculator },
      { href: "/pipelines/rental", label: "Rentals", icon: Heart },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { href: "/news", label: "News & Intel", icon: Newspaper },
      { href: "/grid", label: "The Grid", icon: Grid3x3 },
      { href: "/sphere", label: "Sphere", icon: CircleUser },
      { href: "/underwriter", label: "Underwriter", icon: Calculator },
    ],
  },
  {
    group: "AI Personas",
    items: [
      { href: "/sofia", label: "Sofia", icon: Phone },
      { href: "/vesper", label: "Vesper", icon: Sparkles },
    ],
  },
  {
    group: "Operations",
    items: [
      { href: "/transactions", label: "Transactions", icon: FileText },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment flex">
      <aside className="w-64 bg-ink text-parchment flex-shrink-0 flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="px-6 py-6 border-b border-white/10">
          <Wordmark className="text-parchment text-2xl" />
          <p className="text-[10px] uppercase tracking-[0.22em] text-stone mt-1">Tenant · Bichi</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-6">
          {NAV.map((g) => (
            <div key={g.group}>
              <p className="text-[9px] uppercase tracking-[0.22em] text-stone/70 px-2 mb-2">{g.group}</p>
              <ul className="space-y-0.5">
                {g.items.map((it) => (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={cn(
                        "flex items-center gap-3 px-2 py-2 text-sm text-parchment/80 hover:bg-white/5 hover:text-parchment transition-colors rounded-sm"
                      )}
                    >
                      <it.icon className="w-4 h-4" strokeWidth={1.5} />
                      <span>{it.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-white/10 text-[10px] uppercase tracking-[0.22em] text-stone/60">
          A Tigris Tech Labs Product
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
