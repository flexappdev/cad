#!/usr/bin/env tsx
/**
 * Daily pipeline — orchestrates the end-to-end CAD daily flow LOCALLY.
 *
 * Steps:
 *   1. runDailyCron      — pick topic, generate course, validate, upsert Mongo
 *   2. runMediaStep      — FLUX cover + Seedance intro via Runware → S3 com27
 *   3. patch FLEET.lists — set cover_url + intro_url on the course doc
 *   4. logRun (idempotent) — append cost + ok status to FLEET.runs
 *
 * Used by `pnpm daily` (cron-equivalent) and `pnpm daily:dry` (no writes).
 * Vercel cron (POST /api/cron/daily) is the prod equivalent.
 *
 * Usage:
 *   pnpm daily                    # full run
 *   pnpm daily:dry                # --dry-run, returns JSON, no writes
 *   pnpm daily --topic="<t>"      # force a topic
 *   pnpm daily --force            # overwrite today's existing course
 *   pnpm daily --no-media         # skip Runware (Claude-only run)
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { runDailyCron } from "../src/lib/cron-handler";
import { runMediaStep } from "../src/lib/media-step";
import { genCoverImage, genIntroVideo } from "../src/lib/runware";
import { s3MirrorFromUrl } from "../src/lib/s3";
import { upsertCourse, logRun, listsCollection } from "../src/lib/mongo";

function argFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}
function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i > 0 && i + 1 < process.argv.length) return process.argv[i + 1];
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.split("=").slice(1).join("=") : undefined;
}

async function main() {
  const dryRun = argFlag("dry-run") || argFlag("dry");
  const force = argFlag("force");
  const noMedia = argFlag("no-media");
  const topic = argValue("topic");
  const hint = argValue("hint");

  console.log(`[cad daily] dryRun=${dryRun} force=${force} noMedia=${noMedia} topic=${topic ?? "(auto)"}`);

  // 1. Course generation + Mongo upsert (skipped in dry-run)
  const t0 = Date.now();
  const result = await runDailyCron({ dryRun, force, topic, hint });
  console.log(`[cad daily] cron status=${result.status} run_id=${result.run_id} (${result.duration_ms}ms)`);
  if (result.status === "error") {
    console.error(`[cad daily] ERROR: ${result.message}`);
    process.exit(1);
  }
  if (result.status === "skipped") {
    console.log(`[cad daily] ${result.message}`);
    process.exit(0);
  }
  if (!result.course) {
    console.error("[cad daily] no course returned");
    process.exit(1);
  }

  console.log(`[cad daily] course: ${result.course.title}`);
  console.log(`[cad daily]   topic: ${result.course.topic}, ${result.course.lessons.length} lessons, ~${result.course.duration_min} min`);

  if (dryRun) {
    console.log(`[cad daily] dry-run — printing course JSON (truncated):`);
    console.log(JSON.stringify(result.course, null, 2).slice(0, 800) + "…");
    console.log(`[cad daily] done in ${Date.now() - t0}ms`);
    return;
  }

  // 2. Media step (best-effort — failures logged but don't block)
  let cost_usd = 0;
  let media_errors: string[] = [];
  if (!noMedia) {
    console.log(`[cad daily] running media step…`);
    const media = await runMediaStep(
      { cover_prompt: (result.course.meta as any).cover_prompt ?? result.course.tagline, intro_prompt: (result.course.meta as any).intro_prompt ?? result.course.tagline },
      { date: result.course.date },
      {
        genCover: async (prompt) => {
          const r = await genCoverImage(prompt);
          return { url: r.url, cost: r.cost, task_uuid: r.task_uuid };
        },
        genIntro: async (prompt) => {
          const r = await genIntroVideo(prompt);
          return { url: r.url, cost: r.cost, task_uuid: r.task_uuid };
        },
        mirror: s3MirrorFromUrl,
      },
    );
    cost_usd = media.cost_usd;
    media_errors = media.errors;
    console.log(`[cad daily]   cover_url: ${media.cover_url ?? "(none)"}`);
    console.log(`[cad daily]   intro_url: ${media.intro_url ?? "(none)"}`);
    console.log(`[cad daily]   media cost: $${cost_usd.toFixed(4)}`);
    if (media.errors.length) console.log(`[cad daily]   media errors: ${media.errors.join("; ")}`);

    // 3. Patch the doc with media URLs
    if (media.cover_url || media.intro_url) {
      const lists = await listsCollection();
      await lists.updateOne(
        { _id: result.course._id } as any,
        { $set: { cover_url: media.cover_url, intro_url: media.intro_url } },
      );
      console.log(`[cad daily] patched ${result.course._id} with media URLs`);
    }
  }

  // 4. Append a media-aware run log (in addition to the cron-handler's run log)
  await logRun({
    job: "media",
    started_at: new Date(t0),
    finished_at: new Date(),
    ok: media_errors.length === 0,
    course_id: result.course._id,
    cost_usd,
    error: media_errors.join("; ") || null,
  });

  console.log(`[cad daily] done in ${Date.now() - t0}ms (cost ~$${cost_usd.toFixed(4)})`);
}

main().catch((e) => {
  console.error("[cad daily] FATAL:", e);
  process.exit(1);
});
