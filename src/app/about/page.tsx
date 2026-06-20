import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/shell/Shell";

export const metadata: Metadata = {
  title: "About",
  description: "What CAD is, how it works, and why it ships one fresh course every day.",
};

export default function AboutPage() {
  return (
    <Shell>
      <div className="prose max-w-3xl mx-auto p-6">
      <h1>About CAD</h1>
      <p>
        <strong>CAD — Course A Day</strong> ships one fresh AI-generated micro-course per day, free to read, library
        grows forever. The 24th site in the ABC fleet and the courses-shaped entry in the daily-X family
        (<Link href="https://yb100.vercel.app">LAD</Link>, IAD, PAD, <strong>CAD</strong>).
      </p>

      <h2>How it works</h2>
      <ol>
        <li>
          <strong>00:05 UTC</strong> — a cron job calls <code>/api/cron/daily</code> on prod with the bearer secret.
        </li>
        <li>
          <strong>Topic pick</strong> — Claude scans the last 90 days of CAD titles + topics and picks something
          never done before.
        </li>
        <li>
          <strong>Generate</strong> — Claude Sonnet 4.6 writes a 10–15 lesson course in one shot, validated against
          a strict Zod schema. Failure → retry once; second failure → no course shipped today.
        </li>
        <li>
          <strong>Cover &amp; intro</strong> — Runware FLUX renders the cover image (1024×640) and Seedance
          generates a 5-second intro loop. Both upload to <code>s3://com27/cad/&lt;date&gt;/</code>.
        </li>
        <li>
          <strong>Persist</strong> — the course lands in <code>FLEET.lists</code> with{" "}
          <code>{`{app:'cad', kind:'course'}`}</code>. Idempotent — re-runs of the same day overwrite cleanly.
        </li>
      </ol>

      <h2>Pricing</h2>
      <ul>
        <li><strong>v1</strong> — free. Every course readable without login.</li>
        <li><strong>v2</strong> — opt-in magic-link signup unlocks a <code>/me</code> progress dashboard + daily email digest.</li>
        <li><strong>v3</strong> — £3/mo Pro tier: TTS audio per lesson, printable PDF, quiz certificate.</li>
      </ul>

      <h2>FAQ</h2>
      <h3>Who writes the courses?</h3>
      <p>
        Claude Sonnet does the heavy lifting. The first 5 seed courses (sociology topics) are ported from a 2025-era
        teacher dataset and serve as the library starter pack.
      </p>

      <h3>Can I follow a feed?</h3>
      <p>
        Yes — the RSS feed lives at <Link href="/feed.xml"><code>/feed.xml</code></Link>. One entry per course, newest first.
      </p>

      <h3>Where does my reading history go?</h3>
      <p>Nowhere in v1 — reading is fully anonymous. v2 adds opt-in progress tracking via Supabase magic-link auth.</p>

      <h3>Open-source?</h3>
      <p>
        The code lives at{" "}
        <a href="https://github.com/flexappdev/cad">github.com/flexappdev/cad</a>. MIT licensed.
      </p>

      <h2>Links</h2>
      <ul>
        <li><Link href="/">Catalogue</Link></li>
        <li><Link href="/feed.xml">RSS</Link></li>
        <li><a href="https://github.com/flexappdev/cad">GitHub</a></li>
      </ul>
      </div>
    </Shell>
  );
}
