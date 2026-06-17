"use client";

import { useState } from "react";
import { browserClient, hasSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!hasSupabase()) { setErr("Supabase not configured yet."); setStatus("error"); return; }
    setStatus("sending");
    setErr(null);
    try {
      const s = browserClient();
      const { error } = await s.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setStatus("sent");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "send failed");
      setStatus("error");
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-slate-600">Magic-link only. Admin access is allowlist-gated.</p>
      {status === "sent" ? (
        <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
          Check your email — a magic link is on its way.
        </div>
      ) : (
        <form onSubmit={send} className="space-y-3">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 rounded-lg border border-slate-300"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="px-4 py-2 rounded-lg bg-brand text-brand-fg font-medium disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Send magic link"}
          </button>
          {err && <p className="text-sm text-rose-700">{err}</p>}
        </form>
      )}
    </div>
  );
}
