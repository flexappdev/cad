#!/usr/bin/env tsx
/**
 * Seed CAD with the 5 sociology MD files from ~/courses/_original/.
 *
 * Each MD becomes one Course in FLEET.lists with {app:'cad', kind:'course', seed:true}.
 * Lessons are derived from H2 sections (skipping "Topics" and "Next Steps").
 * Quiz is 5 stub questions per course (placeholder — a future pass can LLM-generate
 * better questions, but the schema needs exactly 5).
 *
 * Dates: backdated 5 days before today so they don't collide with the live cron.
 *
 * Idempotent: re-run safely; replaceOne overwrites by _id.
 *
 * Usage:
 *   pnpm seed         # writes 5 courses
 *   pnpm seed --dry   # parse-only, no Mongo write
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, basename } from "node:path";
import { CourseSchema, type Course, type Lesson, type QuizQuestion } from "../src/lib/schema";
import { upsertCourse } from "../src/lib/mongo";

const SOURCE_DIR = join(homedir(), "courses", "_original");
const DRY = process.argv.includes("--dry") || process.argv.includes("--dry-run");

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function todayMinus(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function parseMd(text: string): { h1: string; sections: { heading: string; body: string }[] } {
  const h1Match = text.match(/^#\s+(.+?)\s*$/m);
  const h1 = h1Match ? h1Match[1].trim() : "Untitled";

  // Split on H2 boundaries
  const parts = text.split(/^##\s+/m).slice(1); // first chunk is preamble before any H2
  const sections = parts.map((p) => {
    const nl = p.indexOf("\n");
    const heading = nl >= 0 ? p.slice(0, nl).trim() : p.trim();
    const body = nl >= 0 ? p.slice(nl + 1).trim() : "";
    return { heading, body };
  });
  return { h1, sections };
}

function deriveKeyIdeas(body: string): string[] {
  // First 3 sentences, trimmed. If body short, fallback to phrases.
  const sentences = body
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12 && s.length <= 200);
  const picks = sentences.slice(0, 3);
  if (picks.length >= 1) return picks;
  return [body.slice(0, 120) || "Core concept of this topic."];
}

function deriveTagline(course_title: string, firstSection: string): string {
  const opening = firstSection
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)[0]
    ?.trim() ?? `An introduction to ${course_title}.`;
  return opening.length <= 160 ? opening : opening.slice(0, 157) + "…";
}

function buildStubQuiz(title: string): QuizQuestion[] {
  // Five generic-but-on-topic MCQs. Placeholders flagged as such so a future
  // /admin "regenerate quiz" action can replace them.
  const prompts = [
    `Which best describes "${title}"?`,
    `Which of these is most central to "${title}"?`,
    `Which is NOT a common feature of "${title}"?`,
    `What is the primary academic frame used to study "${title}"?`,
    `Which discipline most often examines "${title}"?`,
  ];
  return prompts.map((p, i) => ({
    rank: i + 1,
    prompt: p,
    choices: ["a foundational social concept", "an unrelated commercial product", "a recreational hobby", "a culinary technique"],
    answer_index: 0,
    explanation:
      "This seed course uses placeholder quiz options. A future /admin action will regenerate the quiz with topic-specific questions.",
  }));
}

function buildCourse(filename: string, mdText: string, dateString: string): Course {
  const { h1, sections } = parseMd(mdText);

  // Keep H2s that are real lessons — drop Topics + Next Steps
  const lessonSections = sections.filter(
    (s) => !/^topics?$/i.test(s.heading) && !/^next\s*steps?$/i.test(s.heading),
  );

  // Schema requires 10–15. Trim or pad as needed.
  const usable = lessonSections.slice(0, 15);
  const lessons: Lesson[] = usable.map((s, idx) => ({
    rank: idx + 1,
    title: s.heading,
    key_ideas: deriveKeyIdeas(s.body),
    body_md: `## ${s.heading}\n\n${s.body}`.trim(),
    duration_min: Math.max(1, Math.round((s.body.split(/\s+/).length || 50) / 220)), // ~220 wpm
  }));
  if (lessons.length < 10) {
    throw new Error(`${filename}: only ${lessons.length} lessons after filtering — schema needs ≥10`);
  }

  const total_min = lessons.reduce((s, l) => s + l.duration_min, 0);

  const slug = `cad-${dateString}`;
  const tagline = deriveTagline(h1, sections[1]?.body ?? sections[0]?.body ?? "");

  return CourseSchema.parse({
    _id: slug,
    app: "cad",
    kind: "course",
    slug,
    date: dateString,
    title: h1,
    tagline,
    topic: "social-science",
    description: `A ${lessons.length}-lesson seed course on ${h1}, ported from the 2025 sociology corpus. Each lesson is a short essay with key ideas; the capstone quiz is a placeholder pending an /admin regenerate pass.`,
    cover_url: null,
    intro_url: null,
    lessons,
    quiz: buildStubQuiz(h1),
    duration_min: total_min,
    seed: true,
    source: "courses-original",
    created_at: new Date(`${dateString}T00:00:00Z`).toISOString(),
    meta: { model: "seed-import", prompt_version: 0, run_id: `seed-${slugify(filename)}` },
  });
}

async function main() {
  const files = readdirSync(SOURCE_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();
  console.log(`[seed] ${files.length} MDs in ${SOURCE_DIR}`);

  // Backdate: file i → today - (files.length - i) days, so newest file gets the most recent slot
  const courses = files.map((f, i) => {
    const date = todayMinus(files.length - i);
    const text = readFileSync(join(SOURCE_DIR, f), "utf8");
    return { file: f, course: buildCourse(f, text, date) };
  });

  for (const { file, course } of courses) {
    console.log(`  - ${file.padEnd(30)} → ${course._id}  ${course.lessons.length} lessons, ~${course.duration_min} min`);
  }

  if (DRY) {
    console.log(`[seed] --dry — no writes. Sample lesson 1 of ${courses[0].course._id}:`);
    console.log(JSON.stringify(courses[0].course.lessons[0], null, 2));
    return;
  }

  for (const { course } of courses) {
    const r = await upsertCourse(course);
    console.log(`  ✓ ${course._id}  upserted=${r.upsertedId !== null}  matched=${r.matchedCount}`);
  }
  console.log(`[seed] done — ${courses.length} courses in FLEET.lists`);
}

main().catch((e) => {
  console.error("[seed] FATAL:", e);
  process.exit(1);
});
