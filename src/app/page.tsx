import { listCourses } from "@/lib/mongo";
import { CATEGORIES, isFlow, type Category } from "@/lib/catalogue";
import { CatalogueClient } from "@/components/catalogue/CatalogueClient";
import { Shell } from "@/components/shell/Shell";

export const revalidate = 300;

export default async function HomePage(props: { searchParams: Promise<{ section?: string; view?: string; q?: string }> }) {
  const sp = await props.searchParams;
  let allCourses: Awaited<ReturnType<typeof listCourses>> = [];
  try {
    allCourses = await listCourses({ limit: 200 });
  } catch {
    // empty state if Mongo not reachable
  }

  const section = sp.section ?? "All";

  return (
    <Shell footerCount={allCourses.length}>
      <CatalogueClient courses={allCourses} initialSection={section} initialView={sp.view ?? "tiles"} initialQuery={sp.q ?? ""} />
    </Shell>
  );
}

// helper kept here so the page TypeChecks the runtime contract for "section"
function _isKnownSection(s: string): s is "All" | Category {
  return s === "All" || (CATEGORIES as readonly string[]).includes(s) || isFlow(s);
}
void _isKnownSection;
