import { NextResponse, type NextRequest } from "next/server";
import { hasSupabase, serverClientFromRequest } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin";

  if (!hasSupabase() || !code) {
    url.pathname = "/login";
    url.searchParams.set("err", "callback-failed");
    return NextResponse.redirect(url);
  }

  const res = NextResponse.redirect(new URL(next, req.url));
  try {
    const supabase = serverClientFromRequest(req, res);
    await supabase.auth.exchangeCodeForSession(code);
  } catch {
    url.pathname = "/login";
    url.searchParams.set("err", "exchange-failed");
    return NextResponse.redirect(url);
  }
  return res;
}
