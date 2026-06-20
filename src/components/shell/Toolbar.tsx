"use client";

import { LayoutGrid, List, Rows3 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ViewMode = "scroller" | "tiles" | "table";

export function Toolbar({
  title,
  count,
  view,
  onChangeView,
}: {
  title: string;
  count: number;
  view: ViewMode;
  onChangeView: (v: ViewMode) => void;
}) {
  return (
    <div className="h-[44px] flex items-center gap-3 px-4 border-b border-border bg-[var(--surface-1)]">
      <h1 className="font-semibold tracking-tight">{title}</h1>
      <span className="text-xs text-muted-foreground">{count.toLocaleString()} {count === 1 ? "course" : "courses"}</span>

      <div className="ml-auto inline-flex items-center rounded-lg border border-border bg-[var(--surface-2)] p-0.5">
        <ViewBtn active={view === "scroller"} onClick={() => onChangeView("scroller")} label="Scroller"><Rows3 className="h-3.5 w-3.5" /></ViewBtn>
        <ViewBtn active={view === "tiles"} onClick={() => onChangeView("tiles")} label="Tiles"><LayoutGrid className="h-3.5 w-3.5" /></ViewBtn>
        <ViewBtn active={view === "table"} onClick={() => onChangeView("table")} label="Table"><List className="h-3.5 w-3.5" /></ViewBtn>
      </div>
    </div>
  );
}

function ViewBtn({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={cn(
        "h-7 px-2 inline-flex items-center justify-center gap-1.5 rounded-md text-xs font-medium",
        active ? "bg-[var(--surface-1)] text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
