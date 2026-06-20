"use client";

import { useState } from "react";
import { browserClient, hasSupabase } from "@/lib/supabase";

type OAuthProvider = "google" | "github";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
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

  async function handleOAuth(provider: OAuthProvider) {
    if (!hasSupabase()) { setErr("Supabase not configured yet."); return; }
    setOauthLoading(provider);
    setErr(null);
    try {
      const s = browserClient();
      const { error } = await s.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setErr(error.message.includes("not enabled") ? `${provider} OAuth not enabled — see /abc-supabase oauth google enable` : error.message);
        setOauthLoading(null);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : `OAuth not configured for ${provider}`);
      setOauthLoading(null);
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-slate-600">Google or magic-link. Admin access is allowlist-gated to <code>mat@matsiems.com</code>.</p>

      {status === "sent" ? (
        <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
          Check your email — a magic link is on its way.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <button
              onClick={() => handleOAuth("google")}
              disabled={oauthLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
              aria-label="Continue with Google"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21.6 12.227c0-.708-.064-1.388-.184-2.04H12v3.86h5.382a4.6 4.6 0 0 1-1.995 3.018v2.51h3.227c1.887-1.74 2.986-4.3 2.986-7.348Z" fill="#4285F4"/>
                <path d="M12 22c2.7 0 4.964-.895 6.614-2.425l-3.227-2.51c-.896.6-2.04.954-3.387.954-2.604 0-4.81-1.76-5.595-4.124H3.073v2.591A9.997 9.997 0 0 0 12 22Z" fill="#34A853"/>
                <path d="M6.405 13.895A6.014 6.014 0 0 1 6.09 12c0-.66.114-1.3.315-1.895V7.514H3.073A9.997 9.997 0 0 0 2 12c0 1.614.386 3.14 1.073 4.486l3.332-2.59Z" fill="#FBBC05"/>
                <path d="M12 5.982c1.47 0 2.787.505 3.823 1.5l2.866-2.867C16.96 2.99 14.696 2 12 2A9.997 9.997 0 0 0 3.073 7.514l3.332 2.59C7.19 7.741 9.396 5.983 12 5.983Z" fill="#EA4335"/>
              </svg>
              <span className="font-medium text-slate-800">
                {oauthLoading === "google" ? "Redirecting…" : "Continue with Google"}
              </span>
            </button>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider"><span className="bg-white px-3 text-slate-500">or magic link</span></div>
          </div>

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
              disabled={status === "sending" || oauthLoading !== null}
              className="w-full px-4 py-2.5 rounded-lg bg-brand text-brand-fg font-medium disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
          </form>

          {err && <p className="text-sm text-rose-700">{err}</p>}
        </>
      )}
    </div>
  );
}
