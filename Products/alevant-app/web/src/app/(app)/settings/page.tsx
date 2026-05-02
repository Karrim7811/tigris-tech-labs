import Link from "next/link";

const SETTINGS_GROUPS = [
  { title: "Workspace", items: [
    { label: "Brand kit", href: "/settings/brand" },
    { label: "Sofia config", href: "/settings/sofia" },
    { label: "Vesper config", href: "/settings/vesper" },
    { label: "Compliance", href: "/settings/compliance" },
  ]},
  { title: "Integrations", items: [
    { label: "Connected accounts", href: "/settings/integrations" },
    { label: "API keys (BYOK)", href: "/settings/api-keys" },
    { label: "Custom domain", href: "/settings/domain" },
  ]},
  { title: "Team", items: [
    { label: "Members", href: "/settings/members" },
    { label: "Roles & permissions", href: "/settings/roles" },
  ]},
  { title: "Billing", items: [
    { label: "Plan & usage", href: "/settings/billing" },
    { label: "Invoices", href: "/settings/invoices" },
  ]},
  { title: "Data", items: [
    { label: "Export data", href: "/settings/export" },
    { label: "Audit log", href: "/settings/audit" },
  ]},
];

export default function SettingsPage() {
  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Settings</p>
        <h1 className="serif-display text-ink text-5xl">Workspace.</h1>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SETTINGS_GROUPS.map((g) => (
          <div key={g.title} className="border border-mist bg-parchment">
            <div className="p-5 border-b border-mist">
              <p className="eyebrow !text-brass">{g.title}</p>
            </div>
            <ul>
              {g.items.map((it) => (
                <li key={it.href} className="border-b border-mist last:border-b-0">
                  <Link href={it.href} className="block px-5 py-4 text-sm text-ink hover:bg-bone hover:text-indigo transition-colors">
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
