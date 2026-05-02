import { NextResponse } from "next/server";
import { lintFairHousing } from "@/lib/fair-housing";

export async function POST(req: Request) {
  const { text, mode } = await req.json();
  const result = lintFairHousing(String(text || ""), mode === "advisory" ? "advisory" : "strict");
  return NextResponse.json(result);
}
