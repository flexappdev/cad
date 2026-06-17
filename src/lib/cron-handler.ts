import { assembleCourse, generateCourseDraft, type AnthropicLike } from "./generate-course";
import { findCourseBySlug, recentTitlesForDedupe, upsertCourse, logRun, type Course } from "./mongo";

export interface CronInput {
  dryRun?: boolean;
  force?: boolean;
  topic?: string;
  hint?: string;
  date?: string; // override today (tests)
}

export interface CronResult {
  status: "ok" | "skipped" | "dry-run" | "error";
  course?: Course;
  course_id?: string;
  message?: string;
  duration_ms: number;
  run_id: string;
}

export interface CronDeps {
  client?: AnthropicLike;
  /** Override Mongo functions for tests. */
  mongo?: {
    findCourseBySlug: typeof findCourseBySlug;
    recentTitlesForDedupe: typeof recentTitlesForDedupe;
    upsertCourse: typeof upsertCourse;
    logRun: typeof logRun;
  };
  /** Override clock. */
  now?: () => Date;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function dateString(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
function newRunId(): string {
  return `cad-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * The shared cron path — called by /api/cron/daily AND by scripts/daily-pipeline.
 * Pure: takes deps, returns a CronResult. No Next.js coupling.
 */
export async function runDailyCron(input: CronInput, deps: CronDeps = {}): Promise<CronResult> {
  const t0 = Date.now();
  const now = deps.now?.() ?? new Date();
  const date = input.date ?? dateString(now);
  const slug = `cad-${date}`;
  const run_id = newRunId();
  const mongo = deps.mongo ?? { findCourseBySlug, recentTitlesForDedupe, upsertCourse, logRun };

  // Idempotency: skip if today's course already exists, unless force=true
  if (!input.force && !input.dryRun) {
    const existing = await mongo.findCourseBySlug(slug);
    if (existing) {
      return {
        status: "skipped",
        course_id: slug,
        message: `course ${slug} already exists — pass force:true to overwrite`,
        duration_ms: Date.now() - t0,
        run_id,
      };
    }
  }

  try {
    const recentTitles = await mongo.recentTitlesForDedupe(90);
    const draft = await generateCourseDraft({
      topic: input.topic ?? "auto", // when "auto", the prompt + dedupe drive topic picking
      hint: input.hint,
      recentTitles,
      client: deps.client,
    });
    const course = assembleCourse(draft, {
      date,
      run_id,
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
      cover_url: null, // media step in scripts/daily-pipeline patches this
      intro_url: null,
    });

    if (input.dryRun) {
      return { status: "dry-run", course, course_id: slug, duration_ms: Date.now() - t0, run_id };
    }

    await mongo.upsertCourse(course);
    await mongo.logRun({
      job: "daily",
      started_at: now,
      finished_at: new Date(),
      ok: true,
      course_id: slug,
    });
    return { status: "ok", course, course_id: slug, duration_ms: Date.now() - t0, run_id };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (!input.dryRun) {
      await mongo.logRun({
        job: "daily",
        started_at: now,
        finished_at: new Date(),
        ok: false,
        error: message,
      }).catch(() => {});
    }
    return { status: "error", message, duration_ms: Date.now() - t0, run_id };
  }
}

/**
 * Auth + parse for the Next.js Route handler. Returns null when auth fails
 * (the caller responds with 401/403).
 */
export function authorizeBearer(req: Request): { ok: true } | { ok: false; status: 401 | 403 } {
  const secret = process.env.CRON_SECRET;
  if (!secret) return { ok: false, status: 403 };
  const h = req.headers.get("authorization") ?? "";
  if (!h.toLowerCase().startsWith("bearer ")) return { ok: false, status: 401 };
  const provided = h.slice(7).trim();
  if (provided !== secret) return { ok: false, status: 403 };
  return { ok: true };
}
