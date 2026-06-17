import { NextRequest, NextResponse } from "next/server";
import { hasSupabase, serverClientFromRequest, isAllowlistedEmail } from "@/lib/supabase";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Only gate /admin and below
  if (!req.nextUrl.pathname.startsWith("/admin")) return res;

  // If Supabase env is missing, fail closed but never 500 — redirect to /login.
  // (per feedback_supabase_middleware_env_guard — empty env must not crash public surface)
  if (!hasSupabase()) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("err", "supabase-unconfigured");
    return NextResponse.redirect(url);
  }

  try {
    const supabase = serverClientFromRequest(req, res);
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email ?? null;

    if (!data.user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    if (!isAllowlistedEmail(email)) {
      return new NextResponse("forbidden", { status: 401 });
    }
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
