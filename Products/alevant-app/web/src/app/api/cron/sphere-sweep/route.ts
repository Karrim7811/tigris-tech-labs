import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Vercel cron auth
  const auth = req.headers.get("authorization");
  if (process.env.VERCEL_ENV === "production" && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // Forward to actual sweep
  const url = new URL("/api/sphere/sweep", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  const r = await fetch(url, { method: "POST" });
  const json = await r.json();
  return NextResponse.json(json);
}
