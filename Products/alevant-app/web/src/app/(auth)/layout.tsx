import Link from "next/link";
import { Wordmark } from "@/components/alevant/wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bone flex flex-col">
      <header className="px-10 py-6 border-b border-mist bg-parchment">
        <Link href="/"><Wordmark size="sm" /></Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md bg-parchment border border-mist p-10">{children}</div>
      </main>
      <footer className="text-center py-8 text-[10px] uppercase tracking-[0.22em] text-stone">
        A Tigris Tech Labs Product
      </footer>
    </div>
  );
}
