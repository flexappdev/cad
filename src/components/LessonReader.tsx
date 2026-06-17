"use client";

import { useState } from "react";
import type { Course } from "@/lib/schema";
import { QuizBlock } from "./QuizBlock";

function renderMarkdownLite(md: string): string {
  // v1: tiny markdown — headings + paragraphs. No external lib.
  return md
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .split(/\n{2,}/)
    .map((p) => (/^<h[23]>/.test(p) ? p : `<p>${p.replace(/\n/g, " ")}</p>`))
    .join("\n");
}

export function LessonReader({ course }: { course: Course }) {
  const total = course.lessons.length;
  const [idx, setIdx] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const onLast = idx === total - 1;

  if (reviewing) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setReviewing(false)}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Back to lessons
        </button>
        <QuizBlock quiz={course.quiz} />
      </div>
    );
  }

  const lesson = course.lessons[idx];
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Lesson {idx + 1} of {total}</span>
          <span>~ {lesson.duration_min} min</span>
        </div>
        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand transition-all"
            style={{ width: `${((idx + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <article className="prose">
        <h2>{lesson.title}</h2>
        <div dangerouslySetInnerHTML={{ __html: renderMarkdownLite(lesson.body_md) }} />
        <h3>Key ideas</h3>
        <ul>
          {lesson.key_ideas.map((k, i) => <li key={i}>{k}</li>)}
        </ul>
      </article>

      <nav className="flex items-center justify-between pt-6 border-t border-slate-200">
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="px-4 py-2 rounded-lg border border-slate-300 disabled:opacity-40"
        >
          ← Previous
        </button>
        {onLast ? (
          <button
            onClick={() => setReviewing(true)}
            className="px-5 py-2.5 rounded-lg bg-brand text-brand-fg font-medium"
          >
            Take the quiz →
          </button>
        ) : (
          <button
            onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white"
          >
            Next lesson →
          </button>
        )}
      </nav>
    </div>
  );
}
