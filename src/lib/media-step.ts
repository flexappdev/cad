// Media step — wraps Runware + S3 for the daily pipeline. Pulls cover_prompt
// + intro_prompt from the LLM draft, generates assets, mirrors to com27,
// patches the Mongo course doc.
//
// Intro video is best-effort: a failure does NOT fail the run.

import type { LlmCourseOutput } from "./generate-course";

export interface MediaResult {
  cover_url: string | null;
  intro_url: string | null;
  cost_usd: number;
  errors: string[];
}

export interface MediaDeps {
  genCover: (prompt: string) => Promise<{ url: string; cost: number; task_uuid: string }>;
  genIntro: (prompt: string) => Promise<{ url: string; cost: number; task_uuid: string }>;
  mirror: (remoteUrl: string, keySuffix: string, contentType?: string) => Promise<string>;
}

export async function runMediaStep(
  draft: Pick<LlmCourseOutput, "cover_prompt" | "intro_prompt">,
  ctx: { date: string },
  deps: MediaDeps,
): Promise<MediaResult> {
  const out: MediaResult = { cover_url: null, intro_url: null, cost_usd: 0, errors: [] };

  // 1. Cover (FLUX) — failure here is logged but doesn't abort intro
  try {
    const cov = await deps.genCover(draft.cover_prompt);
    out.cost_usd += cov.cost;
    out.cover_url = await deps.mirror(cov.url, `${ctx.date}/cover.jpg`, "image/jpeg");
  } catch (e) {
    out.errors.push(`cover: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2. Intro (Seedance) — best-effort
  try {
    const v = await deps.genIntro(draft.intro_prompt);
    out.cost_usd += v.cost;
    out.intro_url = await deps.mirror(v.url, `${ctx.date}/intro.mp4`, "video/mp4");
  } catch (e) {
    out.errors.push(`intro: ${e instanceof Error ? e.message : String(e)}`);
  }

  return out;
}
