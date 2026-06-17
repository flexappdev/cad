import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findCourseBySlug } from "@/lib/mongo";
import { LessonReader } from "@/components/LessonReader";
import { TopicChip } from "@/components/TopicChip";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const course = await findCourseBySlug(slug);
    if (course) {
      return {
        title: course.title,
        description: course.tagline,
        openGraph: {
          title: course.title,
          description: course.tagline,
          images: course.cover_url ? [course.cover_url] : [],
        },
      };
    }
  } catch {}
  return { title: "Course" };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let course: Awaited<ReturnType<typeof findCourseBySlug>> = null;
  try {
    course = await findCourseBySlug(slug);
  } catch {}
  if (!course) notFound();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link href="/library" className="text-sm text-slate-500 hover:text-slate-900">← Library</Link>
        <h1 className="text-3xl font-semibold tracking-tight">{course.title}</h1>
        <p className="text-lg text-slate-700">{course.tagline}</p>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>{course.date}</span>
          <span>·</span>
          <span>{course.lessons.length} lessons</span>
          <span>·</span>
          <span>~ {course.duration_min} min</span>
          <span>·</span>
          <TopicChip topic={course.topic} />
        </div>
      </header>
      <LessonReader course={course} />
    </div>
  );
}
