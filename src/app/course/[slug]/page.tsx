import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findCourseBySlug } from "@/lib/mongo";
import { LessonReader } from "@/components/LessonReader";
import { Shell } from "@/components/shell/Shell";
import { Badge } from "@/components/ui/Badge";
import { Star, Users, Clock } from "lucide-react";

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

  const status = course.status ?? "Published";

  return (
    <Shell>
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <header className="space-y-3">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Catalogue</Link>
          <div className="flex items-start gap-4">
            <span className="text-4xl">{course.thumbnail ?? "📚"}</span>
            <div className="flex-1">
              <h1 className="text-3xl font-semibold tracking-tight">{course.title}</h1>
              <p className="text-lg text-muted-foreground mt-1">{course.tagline}</p>
            </div>
            <Badge variant={(status as never) ?? "default"}>{status}</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{course.date}</span>
            <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" /> {(course.rating ?? 0).toFixed(1)}</span>
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {(course.enrolled ?? 0).toLocaleString()}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.duration_min} min</span>
            <span>·</span>
            <span>{course.lessons.length} lessons</span>
            {course.category && <><span>·</span><span>{course.category}</span></>}
            {course.level && <><span>·</span><span>{course.level}</span></>}
          </div>
        </header>
        <LessonReader course={course} />
      </div>
    </Shell>
  );
}
