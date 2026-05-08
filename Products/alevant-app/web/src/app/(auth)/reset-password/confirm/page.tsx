"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Lands here after the user clicks the password-recovery link in their email.
 * Supabase's browser client auto-detects the recovery code in the URL
 * (either `?code=...` PKCE or `#access_token=...&type=recovery` implicit) and
 * establishes a temporary session. We then collect a new password and call
 * `updateUser({ password })` to set it.
 */
export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState<"checking" | "ok" | "missing">("checking");
  const [done, setDone] = useState(false);

  // Verify Supabase has established a recovery session from the email link.
  useEffect(() => {
    const sb = getSupabaseBrowser();
    let cancelled = false;

    // Supabase processes the URL hash/code on page load asynchronously — listen
    // for the recovery event, fall back to checking the session after a tick.
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessionReady("ok");
      }
    });

    // Fallback check (covers cases where the event already fired pre-mount)
    setTimeout(async () => {
      if (cancelled) return;
      const { data } = await sb.auth.getSession();
      if (data.session) setSessionReady("ok");
      else setSessionReady((s) => (s === "checking" ? "missing" : s));
    }, 800);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pwd.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (pwd !== pwd2) {
      setErr("Passwords don't match.");
      return;
    }
    setLoading(true);
    const sb = getSupabaseBrowser();
    const { error } = await sb.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  if (sessionReady === "checking") {
    return (
      <>
        <p className="eyebrow !text-indigo mb-3">Reset Password</p>
        <h1 className="serif-display text-ink text-4xl mb-2">One moment…</h1>
        <p className="text-sm text-stone">Verifying your reset link.</p>
      </>
    );
  }

  if (sessionReady === "missing") {
    return (
      <>
        <p className="eyebrow !text-indigo mb-3">Reset Password</p>
        <h1 className="serif-display text-ink text-4xl mb-2">Link expired.</h1>
        <p className="text-sm text-stone mb-8">
          This reset link is invalid or has expired. Request a new one.
        </p>
        <Link href="/reset-password">
          <Button className="w-full">Request a new link</Button>
        </Link>
      </>
    );
  }

  if (done) {
    return (
      <>
        <p className="eyebrow !text-indigo mb-3">Reset Password</p>
        <h1 className="serif-display text-ink text-4xl mb-2">Password updated.</h1>
        <p className="text-sm text-stone">Taking you to your dashboard…</p>
      </>
    );
  }

  return (
    <>
      <p className="eyebrow !text-indigo mb-3">Reset Password</p>
      <h1 className="serif-display text-ink text-4xl mb-2">Set a new password.</h1>
      <p className="text-sm text-stone mb-8">At least 8 characters.</p>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <Label>New password</Label>
          <Input
            type="password"
            required
            minLength={8}
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <Label>Confirm new password</Label>
          <Input
            type="password"
            required
            minLength={8}
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
          />
        </div>
        {err && <p className="text-xs text-error">{err}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </>
  );
}
