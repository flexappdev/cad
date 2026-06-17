import { listCourses } from "@/lib/mongo";
import { CourseCard } from "@/components/CourseCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Library" };
export const dynamic = "force-dynamic";

export default async function LibraryPage(props: { searchParams: Promise<{ topic?: string; q?: string }> }) {
  const sp = await props.searchParams;
  let courses: Awaited<ReturnType<typeof listCourses>> = [];
  try {
    courses = await listCourses({ limit: 48, topic: sp.topic, q: sp.q });
  } catch {
    // MONGODB_URI not set yet
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Library</h1>
        <p className="text-slate-600">Every course CAD has ever shipped. One new entry per day.</p>
      </header>

      <form className="flex flex-wrap gap-3" method="get">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search title, tagline, lesson…"
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-300"
        />
        <select name="topic" defaultValue={sp.topic ?? ""} className="px-3 py-2 rounded-lg border border-slate-300">
          <option value="">all topics</option>
          {["business", "tech", "language", "soft-skill", "general-knowledge", "history", "science", "creativity"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button className="px-4 py-2 rounded-lg bg-slate-900 text-white">Filter</button>
      </form>

      {courses.length === 0 ? (
        <p className="text-slate-500">No courses yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {courses.map((c) => <CourseCard key={c._id} course={c} />)}
        </div>
      )}
    </div>
  );
}
