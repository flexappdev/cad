import { NextResponse } from "next/server";
import { findCourseBySlug } from "@/lib/mongo";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }): Promise<NextResponse> {
  const { slug } = await ctx.params;
  try {
    const course = await findCourseBySlug(slug);
    if (!course) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(course);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
