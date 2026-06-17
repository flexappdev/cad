import Link from "next/link";
import { TopicChip } from "./TopicChip";
import type { Course } from "@/lib/schema";

export function CourseCard({ course }: { course: Pick<Course, "_id" | "title" | "tagline" | "topic" | "cover_url" | "duration_min" | "date"> }) {
  return (
    <Link
      href={`/course/${course._id}`}
      className="group block rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow bg-white"
    >
      <div className="aspect-[16/10] w-full bg-slate-100 relative overflow-hidden">
        {course.cover_url ? (
          // Use plain <img> so the route works without next/image domain config in v1.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.cover_url} alt={course.tagline} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="h-full w-full grid place-items-center text-slate-400">no cover yet</div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{course.date}</span>
          <span>{course.duration_min} min</span>
        </div>
        <h3 className="font-semibold leading-snug">{course.title}</h3>
        <p className="text-sm text-slate-600 line-clamp-2">{course.tagline}</p>
        <TopicChip topic={course.topic} />
      </div>
    </Link>
  );
}
