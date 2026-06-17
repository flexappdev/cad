import { MongoClient, Collection, Db, Document } from "mongodb";
import { CAD_APP_ID, CAD_LISTS_KIND, type Course } from "./schema";

export type { Course } from "./schema";

// Module-scoped cached client. Survives Next.js hot reloads via globalThis.
declare global {
  var __cad_mongo: MongoClient | undefined;
}

const APP = process.env.CAD_APP_ID ?? CAD_APP_ID;
const KIND = process.env.CAD_LISTS_KIND ?? CAD_LISTS_KIND;
const DB_NAME = process.env.MONGODB_DB ?? "FLEET";

async function client(): Promise<MongoClient> {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  if (!globalThis.__cad_mongo) {
    globalThis.__cad_mongo = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      retryWrites: true,
    });
    await globalThis.__cad_mongo.connect();
  }
  return globalThis.__cad_mongo;
}

async function db(): Promise<Db> {
  return (await client()).db(DB_NAME);
}

// --- FLEET helpers — every read/write enforces app+kind discriminator. ---

export async function listsCollection(): Promise<Collection<Document>> {
  return (await db()).collection("lists");
}

/** Today's course or null. */
export async function findCourseBySlug(slug: string): Promise<Course | null> {
  const c = await listsCollection();
  const doc = await c.findOne({ app: APP, kind: KIND, _id: slug } as unknown as Document);
  return doc as unknown as Course | null;
}

/** Recency-sorted course feed for /library and / hero. */
export async function listCourses(opts: { limit?: number; before?: Date; topic?: string; q?: string } = {}): Promise<Course[]> {
  const c = await listsCollection();
  const filter: Document = { app: APP, kind: KIND };
  if (opts.topic) filter.topic = opts.topic;
  if (opts.before) filter.created_at = { $lt: opts.before.toISOString() };
  if (opts.q) filter.$text = { $search: opts.q };
  const cur = c
    .find(filter)
    .sort(opts.q ? { score: { $meta: "textScore" }, created_at: -1 } : { created_at: -1 })
    .limit(opts.limit ?? 24);
  return (await cur.toArray()) as unknown as Course[];
}

/** Idempotent on _id — re-runs overwrite (force-regen path). Discriminator always set. */
export async function upsertCourse(course: Course): Promise<{ upsertedId: string | null; matchedCount: number }> {
  if (course.app !== APP || course.kind !== KIND) {
    throw new Error(`refusing to write course with app=${course.app} kind=${course.kind} — expected app=${APP} kind=${KIND}`);
  }
  const c = await listsCollection();
  const r = await c.replaceOne(
    { _id: course._id } as Document,
    { ...course, app: APP, kind: KIND } as Document,
    { upsert: true },
  );
  return {
    upsertedId: r.upsertedId ? String(r.upsertedId) : null,
    matchedCount: r.matchedCount,
  };
}

/** Dedupe corpus: titles + topics over the last `windowDays` to feed Claude. */
export async function recentTitlesForDedupe(windowDays = 90): Promise<{ title: string; topic: string }[]> {
  const c = await listsCollection();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  const cur = c.find(
    { app: APP, kind: KIND, created_at: { $gte: cutoff.toISOString() } } as Document,
    { projection: { _id: 0, title: 1, topic: 1 } },
  );
  return (await cur.toArray()) as unknown as { title: string; topic: string }[];
}

/** Cron + automation run log into FLEET.runs with app:'cad'. */
export async function logRun(run: {
  job: string;
  started_at: Date;
  finished_at?: Date;
  ok: boolean;
  course_id?: string;
  cost_usd?: number;
  error?: string | null;
}): Promise<void> {
  const r = (await db()).collection("runs");
  await r.insertOne({ app: APP, ...run });
}

/** Featured-of-the-day → FLEET.daily_pick (one row per for_date). */
export async function setDailyPick(for_date: string, course_id: string): Promise<void> {
  const dp = (await db()).collection("daily_pick");
  await dp.replaceOne(
    { app: APP, for_date } as Document,
    { app: APP, for_date, course_id, updated_at: new Date() } as Document,
    { upsert: true },
  );
}

/** Per-app counters for /admin and /abc-mongo cad stats. */
export async function cadStats(): Promise<{ courses: number; runs: number; daily_picks: number }> {
  const d = await db();
  const [courses, runs, daily_picks] = await Promise.all([
    d.collection("lists").countDocuments({ app: APP, kind: KIND }),
    d.collection("runs").countDocuments({ app: APP }),
    d.collection("daily_pick").countDocuments({ app: APP }),
  ]);
  return { courses, runs, daily_picks };
}
