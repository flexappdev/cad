import { describe, it, expect } from "vitest";
import { CourseSchema, LessonSchema, QuizQuestionSchema, type Course } from "@/lib/schema";

const validLesson = {
  rank: 1,
  title: "Why the anchor matters",
  key_ideas: ["Anchor early", "Justify with a reason", "Leave room to widen"],
  body_md: "## Anchor first\n\nAnchoring sets the reference point...",
  duration_min: 2,
};

const validQuiz = {
  rank: 1,
  prompt: "What is the role of an anchor in negotiation?",
  choices: ["Sets reference point", "Reveals weakness", "Ends talks", "Adds friction"],
  answer_index: 0,
  explanation: "Anchors set the reference point that every counter-offer is measured against.",
};

const validCourse: Course = {
  _id: "cad-2026-06-17",
  app: "cad",
  kind: "course",
  slug: "cad-2026-06-17",
  date: "2026-06-17",
  title: "Negotiating With Suppliers",
  tagline: "Lock better terms without burning the relationship.",
  topic: "business",
  description: "A 12-lesson course on supplier negotiation, with a 5-question capstone quiz.",
  cover_url: "https://com27.s3.eu-west-2.amazonaws.com/cad/2026-06-17/cover.jpg",
  intro_url: null,
  lessons: Array.from({ length: 12 }, (_, i) => ({ ...validLesson, rank: i + 1 })),
  quiz: Array.from({ length: 5 }, (_, i) => ({ ...validQuiz, rank: i + 1 })),
  duration_min: 18,
  seed: false,
  source: "claude",
  created_at: new Date().toISOString(),
  meta: { model: "claude-sonnet-4-6", prompt_version: 1, run_id: "01HZ-test" },
};

describe("LessonSchema", () => {
  it("parses a valid lesson", () => {
    expect(() => LessonSchema.parse(validLesson)).not.toThrow();
  });
  it("requires rank to be >= 1", () => {
    expect(() => LessonSchema.parse({ ...validLesson, rank: 0 })).toThrow();
  });
  it("requires non-empty title", () => {
    expect(() => LessonSchema.parse({ ...validLesson, title: "" })).toThrow();
  });
  it("requires at least 1 key_idea", () => {
    expect(() => LessonSchema.parse({ ...validLesson, key_ideas: [] })).toThrow();
  });
});

describe("QuizQuestionSchema", () => {
  it("parses a valid quiz", () => {
    expect(() => QuizQuestionSchema.parse(validQuiz)).not.toThrow();
  });
  it("requires exactly 4 choices", () => {
    expect(() => QuizQuestionSchema.parse({ ...validQuiz, choices: ["a", "b", "c"] })).toThrow();
    expect(() => QuizQuestionSchema.parse({ ...validQuiz, choices: ["a", "b", "c", "d", "e"] })).toThrow();
  });
  it("requires answer_index in 0..3", () => {
    expect(() => QuizQuestionSchema.parse({ ...validQuiz, answer_index: -1 })).toThrow();
    expect(() => QuizQuestionSchema.parse({ ...validQuiz, answer_index: 4 })).toThrow();
  });
});

describe("CourseSchema", () => {
  it("parses a valid course", () => {
    expect(() => CourseSchema.parse(validCourse)).not.toThrow();
  });

  it("rejects course with no app discriminator", () => {
    const { app: _app, ...rest } = validCourse;
    void _app;
    expect(() => CourseSchema.parse(rest)).toThrow();
  });

  it("requires app to be 'cad'", () => {
    expect(() => CourseSchema.parse({ ...validCourse, app: "other" })).toThrow();
  });

  it("requires kind to be 'course'", () => {
    expect(() => CourseSchema.parse({ ...validCourse, kind: "list" })).toThrow();
  });

  it("requires lessons.length in 10..15", () => {
    const tooFew = { ...validCourse, lessons: validCourse.lessons.slice(0, 9) };
    expect(() => CourseSchema.parse(tooFew)).toThrow();
    const tooMany = {
      ...validCourse,
      lessons: [...validCourse.lessons, ...Array(5).fill(validLesson)],
    };
    expect(() => CourseSchema.parse(tooMany)).toThrow();
  });

  it("requires exactly 5 quiz questions", () => {
    expect(() => CourseSchema.parse({ ...validCourse, quiz: validCourse.quiz.slice(0, 4) })).toThrow();
    expect(() => CourseSchema.parse({ ...validCourse, quiz: [...validCourse.quiz, validQuiz] })).toThrow();
  });

  it("requires _id format cad-YYYY-MM-DD", () => {
    expect(() => CourseSchema.parse({ ...validCourse, _id: "cad-bad-id" })).toThrow();
  });

  it("requires _id and slug to match (slug mirrors _id)", () => {
    expect(() => CourseSchema.parse({ ...validCourse, slug: "different-slug" })).toThrow();
  });

  it("allows intro_url to be null", () => {
    expect(() => CourseSchema.parse({ ...validCourse, intro_url: null })).not.toThrow();
  });
});
