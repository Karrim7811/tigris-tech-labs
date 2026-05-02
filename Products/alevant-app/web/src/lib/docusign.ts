// DocuSign — JWT grant auth + envelope helpers + webhook signature verification.
// Docs: https://developers.docusign.com/platform/auth/jwt/jwt-grant-token/
//
// Flow:
//   1. JWT grant exchange → bearer token (cached until exp).
//   2. CRUD envelopes via Envelopes API.
//   3. Subscribe to DocuSign Connect → webhook signed with HMAC SHA-256.

import crypto from "node:crypto";

const ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;
const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY;
const USER_ID = process.env.DOCUSIGN_USER_ID;
const PRIVATE_KEY = process.env.DOCUSIGN_PRIVATE_KEY;
const BASE_URL = process.env.DOCUSIGN_BASE_URL || "https://account.docusign.com";
const REST_BASE = process.env.DOCUSIGN_REST_BASE || "https://na3.docusign.net/restapi";

let cachedToken: { token: string; expires_at: number } | null = null;

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function fetchJWT(): Promise<string> {
  if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) return cachedToken.token;
  if (!INTEGRATION_KEY || !USER_ID || !PRIVATE_KEY) {
    throw new Error("DocuSign env not configured");
  }

  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: INTEGRATION_KEY,
    sub: USER_ID,
    iat: now,
    exp: now + 3600,
    aud: BASE_URL.replace(/^https?:\/\//, ""),
    scope: "signature impersonation",
  };

  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = b64url(signer.sign(PRIVATE_KEY));
  const assertion = `${signingInput}.${signature}`;

  const r = await fetch(`${BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!r.ok) throw new Error(`DocuSign JWT grant failed: ${r.status} ${await r.text()}`);
  const json = (await r.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: json.access_token,
    expires_at: Date.now() + json.expires_in * 1000,
  };
  return cachedToken.token;
}

async function dsFetch(path: string, init: RequestInit = {}) {
  const token = await fetchJWT();
  const r = await fetch(`${REST_BASE}/v2.1/accounts/${ACCOUNT_ID}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  });
  if (!r.ok) throw new Error(`DocuSign ${path} failed: ${r.status} ${await r.text()}`);
  return r.json();
}

export interface CreateEnvelopeOptions {
  emailSubject: string;
  signers: Array<{ email: string; name: string; recipientId?: string }>;
  documents: Array<{ name: string; documentBase64: string; documentId: string; fileExtension?: string }>;
  status?: "sent" | "created";
  customFields?: Record<string, string>;
}

export async function createEnvelope(opts: CreateEnvelopeOptions) {
  return dsFetch("/envelopes", {
    method: "POST",
    body: JSON.stringify({
      emailSubject: opts.emailSubject,
      status: opts.status || "sent",
      documents: opts.documents.map((d) => ({
        documentBase64: d.documentBase64,
        name: d.name,
        documentId: d.documentId,
        fileExtension: d.fileExtension || "pdf",
      })),
      recipients: {
        signers: opts.signers.map((s, i) => ({
          email: s.email,
          name: s.name,
          recipientId: s.recipientId || String(i + 1),
          routingOrder: String(i + 1),
        })),
      },
      customFields: opts.customFields
        ? {
            textCustomFields: Object.entries(opts.customFields).map(([name, value]) => ({
              name,
              value,
              required: "false",
              show: "false",
            })),
          }
        : undefined,
    }),
  });
}

export async function getEnvelope(envelopeId: string) {
  return dsFetch(`/envelopes/${envelopeId}`);
}

export async function listEnvelopeRecipients(envelopeId: string) {
  return dsFetch(`/envelopes/${envelopeId}/recipients`);
}

/** Verify DocuSign Connect HMAC SHA-256 signature on incoming webhooks. */
export function verifyConnectSignature(rawBody: string, providedSignatures: string[]): boolean {
  const secret = process.env.DOCUSIGN_CONNECT_HMAC_SECRET;
  if (!secret) return false;
  const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  return providedSignatures.some((sig) => crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(computed)));
}
