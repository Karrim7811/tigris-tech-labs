"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const sb = getSupabaseBrowser();
    const { error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push("/onboard");
    router.refresh();
  }

  return (
    <>
      <p className="eyebrow !text-indigo mb-3">Request Access</p>
      <h1 className="serif-display text-ink text-4xl mb-2">Begin your workspace.</h1>
      <p className="text-sm text-stone mb-8">A 25-40 minute onboarding follows. You can save and resume.</p>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <Label>Full Name</Label>
          <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {err && <p className="text-xs text-error">{err}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating…" : "Continue to Onboarding"}
        </Button>
      </form>
      <p className="mt-8 text-xs text-stone text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo hover:underline">Sign in</Link>
      </p>
    </>
  );
}
