import { z } from "zod";

export const LessonSchema = z.object({
  rank: z.number().int().min(1),
  title: z.string().min(1),
  key_ideas: z.array(z.string().min(1)).min(1).max(8),
  body_md: z.string().min(1),
  duration_min: z.number().positive(),
});

export const QuizQuestionSchema = z.object({
  rank: z.number().int().min(1).max(5),
  prompt: z.string().min(1),
  choices: z.array(z.string().min(1)).length(4),
  answer_index: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
});

const CourseIdRe = /^cad-\d{4}-\d{2}-\d{2}$/;

// v4.1 — coursai-v3-aligned catalogue facets (all optional for back-compat
// with the 2026-06 sociology seeds which omit these).
export const CATEGORIES = [
  "Foundations",
  "AI Engineering",
  "Machine Learning",
  "Computer Vision",
  "NLP",
  "MLOps",
  "AI Product",
  "Generative AI",
  "Social Science", // sociology seeds bucket
] as const;

export const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export const STATUSES = ["Draft", "Review", "Published", "Featured", "Hot", "New"] as const;

export const CourseSchema = z
  .object({
    _id: z.string().regex(CourseIdRe, "must match cad-YYYY-MM-DD"),
    app: z.literal("cad"),
    kind: z.literal("course"),
    slug: z.string().regex(CourseIdRe),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    title: z.string().min(1),
    tagline: z.string().min(1).max(160),
    topic: z.string().min(1),
    description: z.string().min(1),
    cover_url: z.string().url().nullable(),
    intro_url: z.string().url().nullable(),
    lessons: z.array(LessonSchema).min(10).max(15),
    quiz: z.array(QuizQuestionSchema).length(5),
    duration_min: z.number().positive(),
    seed: z.boolean(),
    source: z.enum(["claude", "courses-original", "placeholder"]),
    created_at: z.string(),
    meta: z.object({
      model: z.string(),
      prompt_version: z.number().int(),
      run_id: z.string(),
    }),
    // v4.1 additions — all optional, back-compat with v1 seeds
    category: z.enum(CATEGORIES).optional(),
    level: z.enum(LEVELS).optional(),
    tags: z.array(z.string()).max(8).optional(),
    status: z.enum(STATUSES).optional(),
    thumbnail: z.string().optional(),              // emoji or URL
    enrolled: z.number().int().nonnegative().optional(),
    rating: z.number().min(0).max(5).optional(),
  })
  .refine((c) => c._id === c.slug, { message: "slug must mirror _id" });

export type Lesson = z.infer<typeof LessonSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Course = z.infer<typeof CourseSchema>;

export const CAD_APP_ID = "cad" as const;
export const CAD_LISTS_KIND = "course" as const;
