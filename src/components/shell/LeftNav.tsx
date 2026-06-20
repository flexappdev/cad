"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { CATEGORIES, CAT_ICON, FLOWS } from "@/lib/catalogue";
import { Home, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
}

export function LeftNav({ open }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const section = searchParams.get("section") ?? "All";
  const onHomePath = pathname === "/" || pathname === "/library";
  const w = open ? "w-[220px]" : "w-[56px]";

  function buildHref(s: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (s === "All") sp.delete("section");
    else sp.set("section", s);
    const q = sp.toString();
    return `/${q ? `?${q}` : ""}`;
  }

  return (
    <nav
      className={cn(
        "sticky top-[52px] h-[calc(100dvh-52px-40px)] border-r border-border bg-[var(--surface-1)] overflow-y-auto transition-[width] duration-200 shrink-0",
        w,
      )}
      aria-label="Primary"
    >
      <ul className="py-2">
        <NavItem href={buildHref("All")} active={onHomePath && section === "All"} icon={<Home className="h-4 w-4" />} label="All courses" open={open} />
      </ul>

      <Group title="Catalogue" open={open}>
        {CATEGORIES.map((c) => {
          const Icon = CAT_ICON[c];
          return (
            <NavItem
              key={c}
              href={buildHref(c)}
              active={onHomePath && section === c}
              icon={<Icon className="h-4 w-4" />}
              label={c}
              open={open}
            />
          );
        })}
      </Group>

      <Group title="Workspaces" open={open}>
        {FLOWS.map((f) => {
          const Icon = f.icon;
          return (
            <NavItem
              key={f.id}
              href={buildHref(f.id)}
              active={onHomePath && section === f.id}
              icon={<Icon className="h-4 w-4" />}
              label={f.label}
              open={open}
            />
          );
        })}
      </Group>

      <Group title="System" open={open}>
        <NavItem href="/about" active={pathname === "/about"} icon={<ChevronRight className="h-4 w-4" />} label="About" open={open} />
        <NavItem href="/admin" active={pathname.startsWith("/admin")} icon={<ChevronRight className="h-4 w-4" />} label="Admin" open={open} />
      </Group>
    </nav>
  );
}

function Group({ title, open, children }: { title: string; open: boolean; children: React.ReactNode }) {
  return (
    <div className="mt-2 border-t border-border pt-2">
      {open && <div className="px-3 text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{title}</div>}
      <ul>{children}</ul>
    </div>
  );
}

function NavItem({ href, active, icon, label, open }: { href: string; active?: boolean; icon: React.ReactNode; label: string; open: boolean }) {
  return (
    <li>
      <Link
        href={href}
        title={label}
        className={cn(
          "flex items-center gap-2 mx-1.5 px-2 py-1.5 rounded-md text-sm",
          active ? "bg-accent text-accent-foreground" : "text-foreground/80 hover:bg-surface-2",
        )}
      >
        <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center text-muted-foreground">{icon}</span>
        {open && <span className="truncate">{label}</span>}
      </Link>
    </li>
  );
}
