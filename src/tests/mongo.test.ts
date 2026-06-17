import { describe, it, expect } from "vitest";
import { upsertCourse } from "@/lib/mongo";
import type { Course } from "@/lib/schema";

// Minimal type-safe stub — exercise the discriminator-guard without a real
// Mongo. The real network path is covered by manual smoke tests against
// the central cluster (see scripts/seed-business-edu.ts).

const baseCourse: Course = {
  _id: "cad-2026-06-17",
  app: "cad",
  kind: "course",
  slug: "cad-2026-06-17",
  date: "2026-06-17",
  title: "T",
  tagline: "t",
  topic: "biz",
  description: "d",
  cover_url: null,
  intro_url: null,
  lessons: [],
  quiz: [] as unknown as Course["quiz"],
  duration_min: 1,
  seed: false,
  source: "claude",
  created_at: new Date().toISOString(),
  meta: { model: "x", prompt_version: 1, run_id: "r" },
};

describe("upsertCourse discriminator guard", () => {
  it("refuses to write a course with wrong app", async () => {
    const bad = { ...baseCourse, app: "ms" as unknown as Course["app"] };
    await expect(upsertCourse(bad)).rejects.toThrow(/refusing to write course/);
  });

  it("refuses to write a course with wrong kind", async () => {
    const bad = { ...baseCourse, kind: "list" as unknown as Course["kind"] };
    await expect(upsertCourse(bad)).rejects.toThrow(/refusing to write course/);
  });

  // Real-Mongo write tested in scripts/seed-business-edu.ts smoke run.
});
