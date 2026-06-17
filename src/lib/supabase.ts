import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export function hasSupabase(): boolean {
  return URL.length > 0 && ANON.length > 0;
}

export const ADMIN_ALLOWLIST = (process.env.ADMIN_ALLOWLIST ?? "mat@matsiems.com")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isAllowlistedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_ALLOWLIST.includes(email.toLowerCase());
}

export function browserClient() {
  if (!hasSupabase()) throw new Error("Supabase env missing");
  return createBrowserClient(URL, ANON);
}

export function serverClientFromRequest(req: NextRequest, res: NextResponse) {
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
}
