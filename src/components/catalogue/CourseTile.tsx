import Link from "next/link";
import { Star, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Course } from "@/lib/schema";

const CAT_EMOJI: Record<string, string> = {
  "Foundations": "🧠",
  "AI Engineering": "⚙️",
  "Machine Learning": "📊",
  "Computer Vision": "👁️",
  "NLP": "📝",
  "MLOps": "🛠️",
  "AI Product": "🚀",
  "Generative AI": "✨",
  "Social Science": "🌍",
};

export function CourseTile({ course, dense }: { course: Course; dense?: boolean }) {
  const emoji = course.thumbnail ?? (course.category ? CAT_EMOJI[course.category] : "📚") ?? "📚";
  const status = course.status ?? "Published";
  return (
    <Link
      href={`/course/${course._id}`}
      className="group block rounded-xl border border-border bg-[var(--surface-1)] hover:border-primary/40 hover:shadow-sm transition overflow-hidden"
    >
      <div className={dense ? "p-3" : "p-4"}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-2xl">{emoji}</span>
          <Badge variant={(status as never) ?? "default"}>{status}</Badge>
        </div>
        <div className="text-xs text-muted-foreground mb-0.5">
          {course.category ?? course.topic} {course.level ? `· ${course.level}` : ""}
        </div>
        <h3 className="font-semibold tracking-tight leading-snug mb-1.5 line-clamp-2">{course.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{course.tagline}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" /> {(course.rating ?? 0).toFixed(1)}</span>
          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {(course.enrolled ?? 0).toLocaleString()}</span>
          <span className="inline-flex items-center gap-1 ml-auto"><Clock className="h-3 w-3" /> {course.duration_min}m</span>
        </div>
      </div>
    </Link>
  );
}
