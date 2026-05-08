/**
 * Provision (or update) a Supabase auth user and attach them to the Bichi
 * workspace as an owner. Credentials are passed via CLI args so they don't
 * end up in source.
 *
 * Usage:
 *   tsx --env-file=.env.local scripts/create-bichi-user.ts <email> <password> [fullName]
 *
 * Idempotent — re-running with the same email updates the password +
 * confirms the email + ensures the membership/agent links are correct.
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const WORKSPACE_SLUG = "bichi";
const AGENT_FULL_NAME = "Thomas Bichi";

async function main() {
  const [email, password, fullNameArg] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: tsx scripts/create-bichi-user.ts <email> <password> [fullName]");
    process.exit(1);
  }
  const fullName = fullNameArg || AGENT_FULL_NAME;

  // ── 1. Create or update the auth user ───────────────────────────────
  const { data: list, error: listErr } = await sb.auth.admin.listUsers();
  if (listErr) {
    console.error("listUsers failed:", listErr.message);
    process.exit(1);
  }
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  let userId: string;
  if (existing) {
    userId = existing.id;
    const { error } = await sb.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) {
      console.error("updateUserById failed:", error.message);
      process.exit(1);
    }
    console.log(`✓ User updated: ${email} (${userId})`);
  } else {
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) {
      console.error("createUser failed:", error.message);
      process.exit(1);
    }
    userId = data.user!.id;
    console.log(`✓ User created: ${email} (${userId})`);
  }

  // ── 2. Find the Bichi workspace ─────────────────────────────────────
  const { data: ws, error: wsErr } = await sb
    .from("workspaces")
    .select("id, name, owner_user_id")
    .eq("slug", WORKSPACE_SLUG)
    .maybeSingle();
  if (wsErr || !ws) {
    console.error(`Workspace '${WORKSPACE_SLUG}' not found:`, wsErr?.message);
    process.exit(1);
  }

  // ── 3. Add as workspace member (owner role) ─────────────────────────
  const { error: memErr } = await sb
    .from("workspace_memberships")
    .upsert(
      { workspace_id: ws.id, user_id: userId, role: "owner" },
      { onConflict: "workspace_id,user_id" }
    );
  if (memErr) {
    console.error("membership upsert failed:", memErr.message);
    process.exit(1);
  }

  // ── 4. Link the agent record to this user_id ────────────────────────
  // The dashboard greets whoever has user_id linked to the agent row.
  const { error: agentErr } = await sb
    .from("agents")
    .update({ user_id: userId })
    .eq("workspace_id", ws.id)
    .eq("full_name", AGENT_FULL_NAME);
  if (agentErr) {
    console.error("agent link failed:", agentErr.message);
  }

  // ── Done ─────────────────────────────────────────────────────────────
  console.log("");
  console.log("✓ Attached to Bichi workspace as owner");
  console.log(`  Workspace: ${ws.name} (${ws.id})`);
  console.log(`  Owner of record: ${ws.owner_user_id ? "(retained — " + ws.owner_user_id.slice(0, 8) + "…)" : "none set"}`);
  console.log(`  Membership role: owner`);
  console.log("");
  console.log(`Log in at https://alevant.ai/login`);
  console.log(`  Email: ${email}`);
  console.log(`  Tenant subdomain: ${WORKSPACE_SLUG}.alevant.ai`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
