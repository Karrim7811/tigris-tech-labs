/**
 * Attach a user to the Bichi workspace as owner — bypasses onboarding.
 *
 * Usage: tsx --env-file=.env.local scripts/attach-user-to-bichi.ts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const TARGET_EMAIL = "karimnasser@me.com";
const TARGET_WORKSPACE_SLUG = "bichi";

async function main() {
  // Find user
  const { data: { users } } = await sb.auth.admin.listUsers();
  const user = users?.find((u) => u.email === TARGET_EMAIL);
  if (!user) {
    console.error(`User not found: ${TARGET_EMAIL}`);
    process.exit(1);
  }

  // Find workspace
  const { data: ws } = await sb
    .from("workspaces")
    .select("id, name")
    .eq("slug", TARGET_WORKSPACE_SLUG)
    .maybeSingle();
  if (!ws) {
    console.error(`Workspace not found: ${TARGET_WORKSPACE_SLUG}`);
    process.exit(1);
  }

  // Set workspace owner
  const { error: ownerErr } = await sb
    .from("workspaces")
    .update({ owner_user_id: user.id })
    .eq("id", ws.id);
  if (ownerErr) {
    console.error("Failed to set owner:", ownerErr.message);
    process.exit(1);
  }

  // Add membership row (idempotent — upsert by primary key)
  const { error: memErr } = await sb
    .from("workspace_memberships")
    .upsert(
      { workspace_id: ws.id, user_id: user.id, role: "owner" },
      { onConflict: "workspace_id,user_id" }
    );
  if (memErr) {
    console.error("Failed to add membership:", memErr.message);
    process.exit(1);
  }

  // Link the existing Bichi agent to this user_id (so cockpit shows correct name)
  await sb
    .from("agents")
    .update({ user_id: user.id })
    .eq("workspace_id", ws.id)
    .eq("full_name", "Thomas Bichi");

  console.log("✓ Attached.");
  console.log(`  User: ${user.email} (${user.id})`);
  console.log(`  Workspace: ${ws.name} (${ws.id})`);
  console.log(`  Role: owner`);
  console.log(`\nLog in at https://alevant.ai/login → cockpit will show the Bichi tenant data.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
