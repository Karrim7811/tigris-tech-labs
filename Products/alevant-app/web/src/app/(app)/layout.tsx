import { Sidebar } from "@/components/alevant/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment flex">
      <Sidebar />
      <main className="flex-1 min-w-0" style={{ marginLeft: 240 }}>
        {children}
      </main>
    </div>
  );
}
