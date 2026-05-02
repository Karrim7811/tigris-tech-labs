import Link from "next/link";
import { Wordmark } from "@/components/alevant/wordmark";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment">
      <header className="fixed top-0 inset-x-0 z-50 h-16 px-10 flex items-center justify-between bg-parchment/90 backdrop-blur-md border-b border-mist">
        <Link href="/"><Wordmark size="sm" /></Link>
        <nav className="hidden md:flex gap-6 text-[11px] uppercase tracking-[0.18em] text-stone">
          <Link href="/pricing" className="hover:text-indigo">Pricing</Link>
          <Link href="/demo" className="hover:text-indigo">Demo</Link>
          <Link href="/waitlist" className="hover:text-indigo">Waitlist</Link>
          <Link href="/press" className="hover:text-indigo">Press</Link>
          <Link href="/login" className="hover:text-indigo">Login</Link>
        </nav>
      </header>
      <div className="pt-16">{children}</div>
      <footer className="bg-ink text-stone py-12 px-10 text-center mt-20">
        <Wordmark className="text-parchment text-3xl mb-3" size="md" />
        <p className="serif-italic text-parchment/55 text-sm mb-6">Where real estate intelligence begins.</p>
        <p className="text-[10px] uppercase tracking-[0.32em] text-parchment/40">A Tigris Tech Labs Product</p>
      </footer>
    </div>
  );
}
