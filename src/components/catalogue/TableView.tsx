import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { Course } from "@/lib/schema";

export function TableView({ courses }: { courses: Course[] }) {
  if (courses.length === 0) return <div className="p-8 text-center text-muted-foreground">No courses match this filter.</div>;
  return (
    <div className="p-2">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface-2)] text-muted-foreground">
            <tr className="text-left">
              <th className="py-2 px-3 font-medium">Course</th>
              <th className="py-2 px-3 font-medium hidden md:table-cell">Category · Level</th>
              <th className="py-2 px-3 font-medium hidden lg:table-cell">Tags</th>
              <th className="py-2 px-3 font-medium text-right">Enrolled</th>
              <th className="py-2 px-3 font-medium text-right">Rating</th>
              <th className="py-2 px-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c._id} className="border-t border-border hover:bg-[var(--surface-2)]">
                <td className="py-2 px-3">
                  <Link href={`/course/${c._id}`} className="flex items-center gap-2">
                    <span className="text-lg">{c.thumbnail ?? "📚"}</span>
                    <span className="font-medium hover:text-primary">{c.title}</span>
                  </Link>
                </td>
                <td className="py-2 px-3 text-muted-foreground hidden md:table-cell">
                  {c.category ?? c.topic} {c.level ? `· ${c.level}` : ""}
                </td>
                <td className="py-2 px-3 text-muted-foreground hidden lg:table-cell">
                  {(c.tags ?? []).slice(0, 3).join(", ")}
                </td>
                <td className="py-2 px-3 text-right tabular-nums">{(c.enrolled ?? 0).toLocaleString()}</td>
                <td className="py-2 px-3 text-right tabular-nums">{(c.rating ?? 0).toFixed(1)}</td>
                <td className="py-2 px-3 text-right">
                  <Badge variant={(c.status as never) ?? "default"}>{c.status ?? "Published"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
