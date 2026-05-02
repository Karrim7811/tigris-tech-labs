import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ALEVANT — Where Real Estate Intelligence Begins",
  description:
    "The AI Operating System for real estate. CRM, marketing, voice ISA, and transaction OS — purpose-built for the modern producing agent.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://alevant.ai"),
  openGraph: {
    title: "ALEVANT",
    description: "Where real estate intelligence begins.",
    siteName: "ALEVANT",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  );
}
