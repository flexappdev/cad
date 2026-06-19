import { listCourses } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 min

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(): Promise<Response> {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://cad-steel.vercel.app").replace(/\/$/, "");
  let courses: Awaited<ReturnType<typeof listCourses>> = [];
  try {
    courses = await listCourses({ limit: 50 });
  } catch {
    // empty feed if Mongo unavailable
  }

  const items = courses
    .map((c) => {
      const link = `${base}/course/${c._id}`;
      const pubDate = new Date(c.created_at).toUTCString();
      return `    <item>
      <title>${escapeXml(c.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(c.tagline)}</description>
      <category>${escapeXml(c.topic)}</category>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CAD — Course A Day</title>
    <link>${base}</link>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
    <description>One fresh AI-generated course per day, free to read.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
