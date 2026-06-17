import { describe, it, expect, vi } from "vitest";
import { runDailyCron, authorizeBearer, type CronDeps } from "@/lib/cron-handler";
import type { AnthropicLike, LlmCourseOutput } from "@/lib/generate-course";
import type { Course } from "@/lib/schema";

const validLesson = {
  rank: 1,
  title: "L",
  key_ideas: ["a", "b", "c"],
  body_md: "## L\n\nbody",
  duration_min: 2,
};
const validQuiz = {
  rank: 1,
  prompt: "q",
  choices: ["a", "b", "c", "d"],
  answer_index: 0,
  explanation: "e",
};
const validOutput: LlmCourseOutput = {
  title: "T",
  tagline: "t",
  topic: "business",
  description: "d",
  lessons: Array.from({ length: 12 }, (_, i) => ({ ...validLesson, rank: i + 1 })),
  quiz: Array.from({ length: 5 }, (_, i) => ({ ...validQuiz, rank: i + 1 })),
  duration_min: 18,
  cover_prompt: "c",
  intro_prompt: "i",
};

function makeClient(text: string): AnthropicLike {
  return { messages: { create: vi.fn().mockResolvedValue({ content: [{ type: "text", text }] }) } };
}

function makeMongo(overrides: Partial<CronDeps["mongo"]> = {}): CronDeps["mongo"] {
  return {
    findCourseBySlug: vi.fn().mockResolvedValue(null),
    recentTitlesForDedupe: vi.fn().mockResolvedValue([]),
    upsertCourse: vi.fn().mockResolvedValue({ upsertedId: "x", matchedCount: 0 }),
    logRun: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as CronDeps["mongo"];
}

describe("runDailyCron", () => {
  it("returns dry-run without calling Mongo write helpers", async () => {
    const mongo = makeMongo();
    const result = await runDailyCron(
      { dryRun: true, date: "2026-06-17" },
      { client: makeClient(JSON.stringify(validOutput)), mongo },
    );
    expect(result.status).toBe("dry-run");
    expect(result.course?._id).toBe("cad-2026-06-17");
    expect(mongo!.upsertCourse).not.toHaveBeenCalled();
    expect(mongo!.logRun).not.toHaveBeenCalled();
  });

  it("returns ok and writes Mongo on a real run", async () => {
    const mongo = makeMongo();
    const result = await runDailyCron(
      { date: "2026-06-17" },
      { client: makeClient(JSON.stringify(validOutput)), mongo },
    );
    expect(result.status).toBe("ok");
    expect(mongo!.upsertCourse).toHaveBeenCalledOnce();
    expect(mongo!.logRun).toHaveBeenCalledOnce();
    const logArg = (mongo!.logRun as unknown as { mock: { calls: [Record<string, unknown>][] } }).mock.calls[0][0];
    expect(logArg.ok).toBe(true);
    expect(logArg.job).toBe("daily");
  });

  it("skips when same-day course exists and force is false", async () => {
    const existing: Partial<Course> = { _id: "cad-2026-06-17" };
    const mongo = makeMongo({ findCourseBySlug: vi.fn().mockResolvedValue(existing) });
    const result = await runDailyCron(
      { date: "2026-06-17" },
      { client: makeClient(JSON.stringify(validOutput)), mongo },
    );
    expect(result.status).toBe("skipped");
    expect(mongo!.upsertCourse).not.toHaveBeenCalled();
  });

  it("overrides existing on force=true", async () => {
    const existing: Partial<Course> = { _id: "cad-2026-06-17" };
    const mongo = makeMongo({ findCourseBySlug: vi.fn().mockResolvedValue(existing) });
    const result = await runDailyCron(
      { date: "2026-06-17", force: true },
      { client: makeClient(JSON.stringify(validOutput)), mongo },
    );
    expect(result.status).toBe("ok");
    expect(mongo!.upsertCourse).toHaveBeenCalledOnce();
  });

  it("returns error + logs failure when generator throws", async () => {
    const mongo = makeMongo();
    const result = await runDailyCron(
      { date: "2026-06-17" },
      { client: makeClient("not-json"), mongo },
    );
    expect(result.status).toBe("error");
    expect(mongo!.upsertCourse).not.toHaveBeenCalled();
    expect(mongo!.logRun).toHaveBeenCalledOnce();
    const logArg = (mongo!.logRun as unknown as { mock: { calls: [Record<string, unknown>][] } }).mock.calls[0][0];
    expect(logArg.ok).toBe(false);
  });
});

describe("authorizeBearer", () => {
  const origSecret = process.env.CRON_SECRET;
  afterAll(() => {
    process.env.CRON_SECRET = origSecret;
  });

  it("403 when CRON_SECRET is unset", () => {
    delete process.env.CRON_SECRET;
    const r = authorizeBearer(new Request("https://x/", { method: "POST" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(403);
  });

  it("401 when no Authorization header", () => {
    process.env.CRON_SECRET = "abc";
    const r = authorizeBearer(new Request("https://x/", { method: "POST" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(401);
  });

  it("403 when wrong bearer", () => {
    process.env.CRON_SECRET = "abc";
    const r = authorizeBearer(new Request("https://x/", { method: "POST", headers: { Authorization: "Bearer wrong" } }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(403);
  });

  it("ok on correct bearer", () => {
    process.env.CRON_SECRET = "abc";
    const r = authorizeBearer(new Request("https://x/", { method: "POST", headers: { Authorization: "Bearer abc" } }));
    expect(r.ok).toBe(true);
  });
});

// expose afterAll for the auth tests above
import { afterAll } from "vitest";
