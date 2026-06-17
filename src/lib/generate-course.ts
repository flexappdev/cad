import { z } from "zod";
import { CAD_APP_ID, CAD_LISTS_KIND, CourseSchema, LessonSchema, QuizQuestionSchema, type Course } from "./schema";

// What we ask Claude to return — narrower than Course (no system fields).
const LlmCourseOutputSchema = z.object({
  title: z.string().min(1),
  tagline: z.string().min(1).max(160),
  topic: z.string().min(1),
  description: z.string().min(1),
  lessons: z.array(LessonSchema).min(10).max(15),
  quiz: z.array(QuizQuestionSchema).length(5),
  duration_min: z.number().positive(),
  cover_prompt: z.string().min(1),
  intro_prompt: z.string().min(1),
});
export type LlmCourseOutput = z.infer<typeof LlmCourseOutputSchema>;

export const PROMPT_VERSION = 1;

const SYSTEM_PROMPT = `You are a course architect for CAD (Course A Day) — a daily learning library.

You generate a single self-contained micro-course on the user-supplied topic. The reader will spend 15-20 minutes on it.

Constraints:
- Exactly 10 to 15 lessons (rank 1..N). Each lesson is a short essay in markdown (3-5 paragraphs), ending with 3-6 key_ideas bullets.
- Exactly 5 quiz questions (rank 1..5). Multiple choice with 4 options and one correct answer.
- "tagline" ≤ 160 characters. Punchy, no clichés.
- "topic" is a single short slug like "business", "tech", "language", "soft-skill", "general-knowledge", "history", "science", "creativity".
- "duration_min" is total estimated reading time.
- "cover_prompt": a vivid FLUX image prompt for the course cover, editorial style, no people.
- "intro_prompt": a 5-second Seedance video loop prompt, slow motion, no text.

Return ONE JSON object matching the schema. No prose, no markdown fences, no commentary.`;

export interface GenerateOpts {
  topic: string;
  hint?: string;
  recentTitles?: { title: string; topic: string }[];
  model?: string;
  /** dependency-injected client (anthropic.Anthropic) — for tests */
  client?: AnthropicLike;
}

export interface AnthropicLike {
  messages: {
    create(args: {
      model: string;
      max_tokens: number;
      system?: string;
      messages: { role: "user" | "assistant"; content: string }[];
    }): Promise<{ content: Array<{ type: string; text?: string }> }>;
  };
}

function buildUserMessage(topic: string, hint: string | undefined, recent: { title: string; topic: string }[]): string {
  const dedupe = recent.length
    ? `\n\nAlready-covered titles in the last 90 days (avoid duplicating these topics):\n${recent
        .map((r) => `- ${r.title} (${r.topic})`)
        .join("\n")}`
    : "";
  const hintLine = hint ? `\n\nOptional hint: ${hint}` : "";
  return `Topic: ${topic}${hintLine}${dedupe}\n\nReturn a single JSON object only.`;
}

/** Extract a JSON object from a string that might wrap it in ``` fences or prose. */
function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  // Try direct parse first
  try {
    return JSON.parse(trimmed);
  } catch {
    // Strip ``` fences if present
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (fenced) {
      return JSON.parse(fenced[1]);
    }
    // Last resort: locate first { ... last }
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(trimmed.slice(first, last + 1));
    }
    throw new Error("no JSON object found in response");
  }
}

/** Assemble a full Course from the LLM's narrow output + system fields. */
export function assembleCourse(
  partial: LlmCourseOutput,
  ctx: { date: string; run_id: string; model: string; cover_url?: string | null; intro_url?: string | null },
): Course {
  const slug = `cad-${ctx.date}`;
  return CourseSchema.parse({
    _id: slug,
    app: CAD_APP_ID,
    kind: CAD_LISTS_KIND,
    slug,
    date: ctx.date,
    title: partial.title,
    tagline: partial.tagline,
    topic: partial.topic,
    description: partial.description,
    cover_url: ctx.cover_url ?? null,
    intro_url: ctx.intro_url ?? null,
    lessons: partial.lessons,
    quiz: partial.quiz,
    duration_min: partial.duration_min,
    seed: false,
    source: "claude",
    created_at: new Date().toISOString(),
    meta: { model: ctx.model, prompt_version: PROMPT_VERSION, run_id: ctx.run_id },
  });
}

/**
 * Call Claude once and parse + validate the output. Retries once on parse
 * failure with the error appended to the system prompt. Throws on second
 * failure.
 */
export async function generateCourseDraft(opts: GenerateOpts): Promise<LlmCourseOutput> {
  const model = opts.model ?? process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
  const client = opts.client ?? (await getDefaultClient());
  const userMsg = buildUserMessage(opts.topic, opts.hint, opts.recentTitles ?? []);

  const attempt = async (extraSystem = ""): Promise<LlmCourseOutput> => {
    const res = await client.messages.create({
      model,
      max_tokens: 12000,
      system: SYSTEM_PROMPT + extraSystem,
      messages: [{ role: "user", content: userMsg }],
    });
    const text = (res.content.find((b) => b.type === "text")?.text ?? "").trim();
    const parsed = extractJson(text);
    return LlmCourseOutputSchema.parse(parsed);
  };

  try {
    return await attempt();
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    return await attempt(`\n\nYour previous response failed validation: ${reason}. Return strict JSON only.`);
  }
}

async function getDefaultClient(): Promise<AnthropicLike> {
  // Lazy import — keeps the test path free of the SDK.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}
