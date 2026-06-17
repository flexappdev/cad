import Link from "next/link";
import { TopicChip } from "./TopicChip";
import type { Course } from "@/lib/schema";

export function DailyHero({ course }: { course: Course }) {
  return (
    <section className="grid md:grid-cols-2 gap-8 items-center py-8">
      <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
        {course.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.cover_url} alt={course.tagline} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center text-slate-400">cover pending</div>
        )}
      </div>
      <div className="space-y-4">
        <div className="text-sm text-slate-500">Today · {course.date}</div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{course.title}</h1>
        <p className="text-lg text-slate-700">{course.tagline}</p>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>{course.lessons.length} lessons</span>
          <span>·</span>
          <span>~ {course.duration_min} min</span>
          <span>·</span>
          <TopicChip topic={course.topic} />
        </div>
        <Link
          href={`/course/${course._id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand text-brand-fg font-medium hover:opacity-90"
        >
          Read course →
        </Link>
      </div>
    </section>
  );
}
