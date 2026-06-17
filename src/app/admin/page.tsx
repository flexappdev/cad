import Link from "next/link";
import { cadStats } from "@/lib/mongo";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let stats = { courses: 0, runs: 0, daily_picks: 0 };
  try {
    stats = await cadStats();
  } catch {}

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">CAD admin</h1>
        <p className="text-slate-600">Allowlist-gated. Magic-link signup at /login.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Courses", value: stats.courses, href: "/library" },
          { label: "Cron runs", value: stats.runs, href: "/admin/runs" },
          { label: "Daily picks", value: stats.daily_picks, href: "/admin" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="block p-6 rounded-xl border border-slate-200 hover:shadow-md transition">
            <div className="text-sm uppercase tracking-wider text-slate-500">{s.label}</div>
            <div className="mt-2 text-3xl font-semibold">{s.value.toLocaleString()}</div>
          </Link>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Quick links</h2>
        <ul className="list-disc pl-5 text-slate-700">
          <li><Link href="/library" className="underline">Library</Link></li>
          <li><a href="https://github.com/flexappdev/cad" className="underline">GitHub repo</a></li>
          <li><code className="text-xs bg-slate-100 px-2 py-0.5 rounded">POST /api/cron/daily</code> — see docs/04-data-flows.md</li>
        </ul>
      </section>
    </div>
  );
}
