"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/schema";

export function QuizBlock({ quiz }: { quiz: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = quiz.reduce((s, q) => s + (answers[q.rank] === q.answer_index ? 1 : 0), 0);

  return (
    <section className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold">Capstone quiz</h2>
        <p className="text-slate-600">5 multiple-choice questions. Submit to reveal explanations.</p>
      </header>

      <ol className="space-y-6">
        {quiz.map((q) => {
          const picked = answers[q.rank];
          const correct = q.answer_index;
          return (
            <li key={q.rank} className="space-y-3 p-4 rounded-lg border border-slate-200 bg-white">
              <div className="font-medium">
                <span className="text-slate-400">Q{q.rank}.</span> {q.prompt}
              </div>
              <div className="grid gap-2">
                {q.choices.map((choice, ci) => {
                  const isPicked = picked === ci;
                  const isCorrect = ci === correct;
                  const tone = submitted
                    ? isCorrect
                      ? "border-emerald-400 bg-emerald-50"
                      : isPicked
                      ? "border-rose-400 bg-rose-50"
                      : "border-slate-200"
                    : isPicked
                    ? "border-brand bg-brand-subtle"
                    : "border-slate-200 hover:border-slate-400";
                  return (
                    <label key={ci} className={`flex items-start gap-3 p-3 rounded border cursor-pointer ${tone}`}>
                      <input
                        type="radio"
                        name={`q${q.rank}`}
                        checked={isPicked}
                        onChange={() => !submitted && setAnswers((a) => ({ ...a, [q.rank]: ci }))}
                        className="mt-1"
                      />
                      <span className="flex-1 text-sm">{choice}</span>
                    </label>
                  );
                })}
              </div>
              {submitted && (
                <p className="text-sm text-slate-600 italic border-l-2 border-slate-300 pl-3">{q.explanation}</p>
              )}
            </li>
          );
        })}
      </ol>

      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < quiz.length}
          className="px-5 py-2.5 rounded-lg bg-brand text-brand-fg font-medium disabled:opacity-40"
        >
          Submit answers
        </button>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
          <span className="font-medium">Score: {score} / {quiz.length}</span>
          <button
            onClick={() => { setAnswers({}); setSubmitted(false); }}
            className="text-sm text-slate-700 underline"
          >
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
