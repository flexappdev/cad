import { CourseTile } from "./CourseTile";
import type { Course } from "@/lib/schema";

export function TilesView({ courses }: { courses: Course[] }) {
  if (courses.length === 0) {
    return <EmptyState />;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {courses.map((c) => (
        <CourseTile key={c._id} course={c} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-12 text-center space-y-2">
      <div className="text-5xl">📚</div>
      <p className="text-lg font-medium">No courses match this filter</p>
      <p className="text-sm text-muted-foreground">Try a different category or clear the search.</p>
    </div>
  );
}
