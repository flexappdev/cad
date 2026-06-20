"use client";

import Link from "next/link";
import { Star, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Course } from "@/lib/schema";

export function ScrollerView({ courses }: { courses: Course[] }) {
  if (courses.length === 0) return <div className="p-8 text-center text-muted-foreground">No courses match this filter.</div>;
  return (
    <div className="snap-y-mandatory overflow-y-auto h-[calc(100dvh-52px-44px-40px)] px-4 py-4">
      {courses.map((c) => (
        <article
          key={c._id}
          className="snap-start-center h-[calc(100dvh-52px-44px-40px-32px)] mb-4 rounded-2xl border border-border bg-[var(--surface-1)] p-8 flex flex-col"
        >
          <div className="flex items-start justify-between mb-4">
            <span className="text-5xl">{c.thumbnail ?? "📚"}</span>
            <Badge variant={(c.status as never) ?? "default"}>{c.status ?? "Published"}</Badge>
          </div>
          <div className="text-sm text-muted-foreground mb-1">
            {c.category ?? c.topic} {c.level ? `· ${c.level}` : ""}
          </div>
          <h2 className="text-3xl font-semibold tracking-tight mb-3">{c.title}</h2>
          <p className="text-lg text-foreground/80 mb-6 max-w-2xl">{c.tagline}</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl line-clamp-4">{c.description}</p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
            <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4" /> {(c.rating ?? 0).toFixed(1)}</span>
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> {(c.enrolled ?? 0).toLocaleString()} enrolled</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {c.duration_min} min</span>
            <span>{c.lessons.length} lessons</span>
          </div>

          <Link
            href={`/course/${c._id}`}
            className="mt-auto inline-flex items-center justify-center self-start px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90"
          >
            Open course →
          </Link>
        </article>
      ))}
    </div>
  );
}
