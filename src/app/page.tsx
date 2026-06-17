import Link from "next/link";
import { listCourses } from "@/lib/mongo";
import { CourseCard } from "@/components/CourseCard";
import { DailyHero } from "@/components/DailyHero";

export const revalidate = 300; // 5 min ISR

export default async function HomePage() {
  let courses: Awaited<ReturnType<typeof listCourses>> = [];
  try {
    courses = await listCourses({ limit: 7 });
  } catch {
    // MONGODB_URI not set yet → empty state
  }
  const today = courses[0];
  const recent = courses.slice(1);

  return (
    <div className="space-y-12">
      {today ? (
        <DailyHero course={today} />
      ) : (
        <section className="py-12 text-center space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">No course yet today</h1>
          <p className="text-slate-600">The daily cron runs at 00:05 UTC. Check back soon — or browse the library.</p>
          <Link href="/library" className="inline-block mt-3 text-brand underline">Open the library →</Link>
        </section>
      )}

      {recent.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent</h2>
            <Link href="/library" className="text-sm text-brand">See all →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recent.map((c) => <CourseCard key={c._id} course={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}
