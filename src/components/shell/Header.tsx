"use client";

import Link from "next/link";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Bell, Menu, Moon, Plus, Search, Sparkles, Sun } from "lucide-react";
import { Btn } from "@/components/ui/Btn";

export function Header({ onToggleNav, onNewCourse }: { onToggleNav?: () => void; onNewCourse?: () => void }) {
  const { theme, toggle } = useTheme();
  return (
    <header
      className="sticky top-0 z-30 h-[52px] flex items-center gap-3 px-4 border-b border-border bg-[var(--surface-1)]"
      style={{ backdropFilter: "saturate(180%) blur(10px)" }}
    >
      <Btn variant="ghost" size="icon" aria-label="Toggle nav" onClick={onToggleNav}>
        <Menu className="h-4 w-4" />
      </Btn>

      <Link href="/" className="flex items-center gap-2 mr-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="font-semibold tracking-tight">CAD</span>
        <span className="text-xs text-muted-foreground hidden md:inline">Course A Day</span>
      </Link>

      <div className="relative flex-1 max-w-sm">
        <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search courses, tags, lessons…"
          className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-border bg-[var(--surface-2)] placeholder:text-muted-foreground focus:bg-[var(--surface-1)] focus:border-primary focus:outline-none"
          onChange={(e) => {
            // wired by parent via SearchParams in Phase 2 — for now, post a custom event
            window.dispatchEvent(new CustomEvent("cad:search", { detail: e.currentTarget.value }));
          }}
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Btn variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Btn>
        <Btn variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Btn>
        <Btn variant="primary" size="sm" onClick={onNewCourse}>
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New course</span>
        </Btn>
      </div>
    </header>
  );
}
