import { cn } from "@/lib/cn";

type Variant = "Draft" | "Review" | "Published" | "Featured" | "Hot" | "New" | "default";

const TONE: Record<Variant, string> = {
  Draft:     "bg-surface-2 text-muted-foreground border-border",
  Review:    "bg-warning-soft text-[var(--warning)] border-[var(--warning)]",
  Published: "bg-success-soft text-[var(--success)] border-[var(--success)]",
  Featured:  "bg-primary-soft text-[var(--accent-foreground)] border-primary",
  Hot:       "bg-[color:var(--hot)]/10 text-[var(--hot)] border-[var(--hot)]",
  New:       "bg-[color:var(--new)]/10 text-[var(--new)] border-[var(--new)]",
  default:   "bg-surface-2 text-muted-foreground border-border",
};

export function Badge({ children, variant = "default", className }: { children: React.ReactNode; variant?: Variant; className?: string }) {
  return (
    <span className={cn("inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border", TONE[variant], className)}>
      {children}
    </span>
  );
}
