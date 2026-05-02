import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";
import { verifyConnectSignature } from "@/lib/docusign";

/**
 * DocuSign Connect webhook.
 * Verifies HMAC signature, then updates the transaction milestone(s) tied to the envelope.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-docusign-signature-1");
  if (process.env.VERCEL_ENV === "production") {
    if (!sig || !verifyConnectSignature(raw, [sig])) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const svc = getSupabaseService();
  const envelopeId: string | undefined = payload?.data?.envelopeId || payload?.envelopeId;
  const status: string | undefined = payload?.data?.envelopeSummary?.status || payload?.status;
  if (!envelopeId) return NextResponse.json({ ok: true });

  // Update transaction by docusign_envelope_id
  if (status === "completed") {
    await svc
      .from("transactions")
      .update({ status: "active", actual_close: status === "completed" ? new Date().toISOString().split("T")[0] : null })
      .eq("docusign_envelope_id", envelopeId);
  }

  return NextResponse.json({ ok: true });
}
