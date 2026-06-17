import { NextResponse } from "next/server";
import { listCourses } from "@/lib/mongo";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 24), 100);
  const topic = url.searchParams.get("topic") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const beforeIso = url.searchParams.get("before");
  const before = beforeIso ? new Date(beforeIso) : undefined;
  try {
    const items = await listCourses({ limit, topic, q, before });
    return NextResponse.json({ items, count: items.length });
  } catch (e) {
    return NextResponse.json({ items: [], count: 0, error: e instanceof Error ? e.message : "error" }, { status: 200 });
  }
}
