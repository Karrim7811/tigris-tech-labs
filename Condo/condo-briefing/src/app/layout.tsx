import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Florida Condo Market — A Producer's Briefing | Aon",
  description:
    "Market briefing for FirstService Residential property managers. Miami, May 6, 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="deck-root">{children}</body>
    </html>
  );
}
