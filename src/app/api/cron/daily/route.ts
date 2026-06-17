import { NextResponse } from "next/server";
import { authorizeBearer, runDailyCron, type CronInput } from "@/lib/cron-handler";

export const runtime = "nodejs"; // Mongo + Anthropic SDK both need Node
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<NextResponse> {
  const auth = authorizeBearer(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  let body: CronInput = {};
  try {
    if (req.headers.get("content-length") && req.headers.get("content-length") !== "0") {
      body = (await req.json()) as CronInput;
    }
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const result = await runDailyCron(body);
  const httpStatus = result.status === "error" ? 500 : 200;
  return NextResponse.json(result, { status: httpStatus });
}

export async function GET(req: Request): Promise<NextResponse> {
  // Convenience GET for Vercel Cron (which uses GET by default).
  return POST(req);
}
