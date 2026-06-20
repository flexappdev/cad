"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toolbar, type ViewMode } from "@/components/shell/Toolbar";
import { TilesView } from "./TilesView";
import { TableView } from "./TableView";
import { ScrollerView } from "./ScrollerView";
import { WorkspaceView } from "@/components/workspace/WorkspaceView";
import { isFlow, type FlowId } from "@/lib/catalogue";
import type { Course } from "@/lib/schema";

interface Props {
  courses: Course[];
  initialSection: string;
  initialView: string;
  initialQuery: string;
}

export function CatalogueClient({ courses, initialSection, initialView, initialQuery }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<ViewMode>(normalizeView(initialView));
  const [query, setQuery] = useState(initialQuery);

  // Listen for the Header's search input via the cad:search custom event
  useEffect(() => {
    function onSearch(e: Event) {
      const ce = e as CustomEvent<string>;
      setQuery(ce.detail ?? "");
    }
    window.addEventListener("cad:search", onSearch as EventListener);
    return () => window.removeEventListener("cad:search", onSearch as EventListener);
  }, []);

  // Persist view to URL
  useEffect(() => {
    const sp = new URLSearchParams(searchParams.toString());
    if (view === "tiles") sp.delete("view");
    else sp.set("view", view);
    const next = sp.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(`/${next ? `?${next}` : ""}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const section = initialSection;

  // Filter by section + query
  const filtered = useMemo(() => {
    let arr = courses;
    if (section !== "All" && !isFlow(section)) {
      arr = arr.filter((c) => c.category === section);
    }
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter((c) =>
        [c.title, c.tagline, c.topic, c.category, ...(c.tags ?? [])]
          .filter(Boolean)
          .some((s) => (s as string).toLowerCase().includes(q)),
      );
    }
    return arr;
  }, [courses, section, query]);

  const flow = isFlow(section) ? (section as FlowId) : null;

  return (
    <>
      <Toolbar
        title={flow ? `Workspaces / ${capitalize(flow)}` : section === "All" ? "All courses" : section}
        count={filtered.length}
        view={view}
        onChangeView={setView}
      />
      {flow ? (
        <WorkspaceView flow={flow} courses={courses} />
      ) : view === "tiles" ? (
        <TilesView courses={filtered} />
      ) : view === "table" ? (
        <TableView courses={filtered} />
      ) : (
        <ScrollerView courses={filtered} />
      )}
    </>
  );
}

function normalizeView(v: string): ViewMode {
  return v === "table" || v === "scroller" ? v : "tiles";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
