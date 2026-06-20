import Link from "next/link";
import { cadStats } from "@/lib/mongo";
import { Shell } from "@/components/shell/Shell";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let stats = { courses: 0, runs: 0, daily_picks: 0 };
  try {
    stats = await cadStats();
  } catch {}

  return (
    <Shell>
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">CAD admin</h1>
          <p className="text-muted-foreground">Allowlist-gated. Magic-link or Google sign-in at <Link href="/login" className="underline">/login</Link>.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Courses", value: stats.courses, href: "/", sub: "in FLEET.lists" },
            { label: "Cron runs", value: stats.runs, href: "/admin", sub: "in FLEET.runs" },
            { label: "Daily picks", value: stats.daily_picks, href: "/admin", sub: "in FLEET.daily_pick" },
          ].map((s) => (
            <Link key={s.label} href={s.href} className="block p-6 rounded-xl border border-border bg-[var(--surface-1)] hover:border-primary/40 hover:shadow-sm transition">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums">{s.value.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
            </Link>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Quick links</h2>
          <ul className="space-y-1.5 text-sm">
            <li>· <Link href="/" className="underline hover:text-primary">Catalogue (/)</Link></li>
            <li>· <a href="https://github.com/flexappdev/cad" className="underline hover:text-primary">GitHub repo</a></li>
            <li>· <code className="text-xs bg-[var(--surface-2)] px-2 py-0.5 rounded">POST /api/cron/daily</code> — see <code>docs/04-data-flows.md</code></li>
            <li>· <code className="text-xs bg-[var(--surface-2)] px-2 py-0.5 rounded">pnpm seed:95</code> — re-run placeholder backfill</li>
          </ul>
        </section>
      </div>
    </Shell>
  );
}
