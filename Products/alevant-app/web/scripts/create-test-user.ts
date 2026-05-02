/**
 * One-off: create a test user via Supabase admin API.
 * Bypasses email verification so the account is immediately usable.
 *
 * Usage: tsx --env-file=.env.local scripts/create-test-user.ts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const email = "karimnasser@me.com";
  const password = "Text7811!";
  const fullName = "Karim Nasser";

  // Check if user already exists
  const { data: existing } = await sb.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === email);
  if (found) {
    console.log(`✓ User already exists: ${found.id}`);
    // Update password to ensure it matches
    const { error: updErr } = await sb.auth.admin.updateUserById(found.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (updErr) {
      console.error("Failed to update existing user:", updErr.message);
      process.exit(1);
    }
    console.log("✓ Password reset to:", password);
    console.log("✓ Email confirmed.");
    return;
  }

  // Create new user
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    console.error("Failed to create user:", error.message);
    process.exit(1);
  }

  console.log("✓ User created:");
  console.log(`  ID: ${data.user?.id}`);
  console.log(`  Email: ${data.user?.email}`);
  console.log(`  Name: ${fullName}`);
  console.log(`  Password: ${password}`);
  console.log(`\nSign in at: https://alevant.ai/login`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
