import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;
let foundryClient: Anthropic | null = null;

export type ModelTier = "fast" | "synth" | "creative";

export function getAnthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export function getFoundry(): Anthropic | null {
  const endpoint = process.env.AZURE_ANTHROPIC_ENDPOINT;
  const key = process.env.AZURE_ANTHROPIC_API_KEY;
  if (!endpoint || !key) return null;
  if (!foundryClient) {
    foundryClient = new Anthropic({
      apiKey: key,
      baseURL: endpoint,
    });
  }
  return foundryClient;
}

export function modelFor(tier: ModelTier): string {
  switch (tier) {
    case "fast":
      return process.env.ANTHROPIC_MODEL_FAST || "claude-haiku-4-5-20251001";
    case "synth":
      return process.env.ANTHROPIC_MODEL_SYNTH || "claude-sonnet-4-6";
    case "creative":
      return process.env.ANTHROPIC_MODEL_CREATIVE || "claude-opus-4-7";
  }
}

export interface ClaudeRunOptions {
  tier?: ModelTier;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  preferFoundry?: boolean;
  cacheSystem?: boolean;
}

export async function runClaude({
  tier = "fast",
  system,
  user,
  maxTokens = 2048,
  temperature = 0.7,
  preferFoundry = false,
  cacheSystem = true,
}: ClaudeRunOptions): Promise<string> {
  const c = (preferFoundry && getFoundry()) || getAnthropic();
  const resp = await c.messages.create({
    model: modelFor(tier),
    max_tokens: maxTokens,
    temperature,
    system: cacheSystem
      ? [{ type: "text", text: system, cache_control: { type: "ephemeral" } }]
      : system,
    messages: [{ role: "user", content: user }],
  });
  const block = resp.content[0];
  if (block?.type === "text") return block.text;
  return "";
}

export async function runClaudeJSON<T>(opts: ClaudeRunOptions): Promise<T> {
  const text = await runClaude({
    ...opts,
    system: opts.system + "\n\nReturn ONLY valid JSON. No prose. No markdown fences.",
  });
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(stripped) as T;
  } catch (e) {
    throw new Error(`Claude returned non-JSON: ${stripped.slice(0, 200)}`);
  }
}
