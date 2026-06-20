import { FLOWS, type FlowId } from "@/lib/catalogue";
import { CourseTile } from "@/components/catalogue/CourseTile";
import type { Course } from "@/lib/schema";

interface Props {
  flow: FlowId;
  courses: Course[];
}

export function WorkspaceView({ flow, courses }: Props) {
  const meta = FLOWS.find((f) => f.id === flow);
  if (!meta) return null;
  const Icon = meta.icon;

  const stats = computeStats(flow, courses);

  return (
    <div className="p-6 space-y-8">
      <header className="flex items-start gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{meta.label} workspace</h1>
          <p className="text-muted-foreground">{meta.blurb}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-[var(--surface-1)] p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-semibold tabular-nums mt-1">{s.value}</div>
            {s.sub && <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>}
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">{sectionTitle(flow)}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {courses.slice(0, 6).map((c) => (
            <CourseTile key={c._id} course={c} dense />
          ))}
        </div>
      </section>
    </div>
  );
}

function sectionTitle(flow: FlowId): string {
  return {
    student: "Continue learning",
    teacher: "Courses you teach",
    admin:   "Recently published",
    super:   "Blueprint snapshots",
  }[flow];
}

function computeStats(flow: FlowId, courses: Course[]): { label: string; value: string; sub?: string }[] {
  const totalEnrol = courses.reduce((s, c) => s + (c.enrolled ?? 0), 0);
  const avgRating = courses.length ? (courses.reduce((s, c) => s + (c.rating ?? 0), 0) / courses.length).toFixed(1) : "—";
  const totalMin = courses.reduce((s, c) => s + c.duration_min, 0);
  const published = courses.filter((c) => (c.status ?? "Published") === "Published").length;

  switch (flow) {
    case "student":
      return [
        { label: "Enrolled", value: "4", sub: "active courses" },
        { label: "Completed", value: "1", sub: "with certificate" },
        { label: "Quiz avg", value: "82%", sub: "across 5 quizzes" },
        { label: "Streak", value: "7", sub: "days" },
      ];
    case "teacher":
      return [
        { label: "Authored", value: "12" },
        { label: "Enrolments", value: totalEnrol.toLocaleString(), sub: "this term" },
        { label: "Avg rating", value: String(avgRating), sub: "across courses" },
        { label: "Pending review", value: "3" },
      ];
    case "admin":
      return [
        { label: "Total courses", value: courses.length.toString() },
        { label: "Published", value: published.toString() },
        { label: "Categories", value: "9" },
        { label: "Reading time", value: `${Math.round(totalMin / 60)}h` },
      ];
    case "super":
      return [
        { label: "Schema version", value: "v4.1" },
        { label: "FLEET shape", value: "20 colls" },
        { label: "Routes", value: "11" },
        { label: "Tests", value: "41" },
      ];
  }
}
