"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const sb = getSupabaseBrowser();
    const redirectTo = `${window.location.origin}/reset-password/confirm`;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <>
        <p className="eyebrow !text-indigo mb-3">Reset Password</p>
        <h1 className="serif-display text-ink text-4xl mb-2">Check your email.</h1>
        <p className="text-sm text-stone mb-8">
          If an account exists for <strong className="text-ink">{email}</strong>, a password
          reset link is on its way. The link expires in 1 hour.
        </p>
        <p className="text-xs text-stone">
          Didn't get it? Check spam, then{" "}
          <button
            onClick={() => setSent(false)}
            className="text-indigo hover:underline"
          >
            try again
          </button>
          .
        </p>
        <p className="mt-8 text-xs text-stone text-center">
          <Link href="/login" className="text-indigo hover:underline">Back to sign in</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <p className="eyebrow !text-indigo mb-3">Reset Password</p>
      <h1 className="serif-display text-ink text-4xl mb-2">Forgot it?</h1>
      <p className="text-sm text-stone mb-8">
        Enter the email tied to your workspace and we'll send a reset link.
      </p>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>
        {err && <p className="text-xs text-error">{err}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-8 text-xs text-stone text-center">
        Remembered it?{" "}
        <Link href="/login" className="text-indigo hover:underline">Sign in</Link>
      </p>
    </>
  );
}
