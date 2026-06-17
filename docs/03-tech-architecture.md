# 03 · Tech Architecture

## Stack

| Layer | Choice | Version | Source |
|---|---|---|---|
| Framework | Next.js (app router) | 15.5.18 | matches yb100 / fs / lituk |
| UI | React | 19.0.0 | fleet baseline |
| CSS | Tailwind | 3.4.13 | fleet baseline |
| Lang | TypeScript | 5.8.2 | fleet baseline |
| Auth | Supabase SSR | 0.10.3 | fleet baseline (allowlist gate) |
| Content store | MongoDB (driver) | 6.10.0 | `FLEET.lists` w/ `{app:'cad', kind:'course'}` |
| Object store | S3 com27 (eu-west-2) | aws-sdk v3 | `cad/` prefix |
| LLM | Anthropic SDK | 0.30.1 | Sonnet 4.6 default |
| Image gen | Runware FLUX | `runware:100@1` | covers |
| Video gen | Runware Seedance | `bytedance:2@2` | 5s intro loops |
| Email | Resend | (v2) | daily digest |
| Tests | Vitest | 2.1.5 | hardening harness mirrors fs |
| E2E | Playwright | 1.60 | mirrors fs |

**Why njs over fapi (decision recap):** Every fleet site
(yb100, fs, lituk, wikai) runs Next.js 15 + React 19 + Supabase + Mongo
+ S3. The `~/courses/` FastAPI backend is five trivial CRUD routes with
no heavy compute, so unifying on the fleet stack removes a deployment
surface, reuses every `/abc-*` skill (vercel, github, supabase, mongo,
ga, runware, fleet-loop), and shares infra (Vercel project, Supabase
migrations, S3 bucket).

## Env contract

Authoritative list — `.env.local.example` is the source of truth.

| Var | Used in | Notes |
|---|---|---|
| `MONGODB_URI` | `src/lib/mongo.ts` | Central Atlas cluster; reads/writes `FLEET` DB |
| `MONGODB_DB` | `src/lib/mongo.ts` | `FLEET` (shared cluster-wide DB per MONGO-FLEET-SCHEMA) |
| `CAD_APP_ID` | `src/lib/mongo.ts` | `cad` — the `app` discriminator on every write |
| `CAD_LISTS_KIND` | `src/lib/mongo.ts` | `course` — the `kind` sub-discriminator within `FLEET.lists` |
| `S3_REGION` | `src/lib/s3.ts` | **Must** be `eu-west-2`; Vercel injects `AWS_REGION=us-east-1` which silently mis-targets the bucket (per `feedback_vercel_aws_region_injection`) |
| `S3_BUCKET` | `src/lib/s3.ts` | `com27` |
| `S3_PREFIX` | `src/lib/s3.ts` | `cad` |
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/supabase.ts` | Strip whitespace before save — clipboard trap per `project_corrupted_env` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | |
| `SUPABASE_SERVICE_ROLE_KEY` | server | RLS bypass for admin tab |
| `ADMIN_ALLOWLIST` | middleware | Comma list; v1 = `mat@matsiems.com` |
| `ANTHROPIC_API_KEY` | `src/lib/generate-course.ts` | |
| `ANTHROPIC_MODEL` | `src/lib/generate-course.ts` | Default `claude-sonnet-4-6` |
| `RUNWARE_API_KEY` | `scripts/daily-pipeline.ts` | |
| `RUNWARE_IMAGE_MODEL` | pipeline | Pin to `runware:100@1` — default is video (per `feedback_runware_default_model_is_video`) |
| `RUNWARE_VIDEO_MODEL` | pipeline | `bytedance:2@2` (Seedance) |
| `NEXT_PUBLIC_GA_ID` | `src/app/layout.tsx` | `/abc-ga sync cad G-XXXX` |
| `RESEND_API_KEY` | (v2) | digest |
| `CRON_SECRET` | `/api/cron/daily` | Bearer token from `/abc-fleet-loop` |
| `NEXT_PUBLIC_APP_URL` | self-calls | **Must** be patched to the Vercel prod alias after first deploy — localhost value silently breaks fire-and-forget (per `feedback_next_public_app_url_prod`) |

## Repo layout

```
src/
├── app/
│   ├── layout.tsx            // Header + Footer + ConsentBanner; GA4 wrapper
│   ├── globals.css           // @tailwind base/components/utilities
│   ├── page.tsx              // / — DailyHero + recent grid
│   ├── library/page.tsx
│   ├── course/[slug]/page.tsx
│   ├── about/page.tsx
│   ├── login/page.tsx
│   ├── auth/callback/route.ts
│   ├── admin/page.tsx
│   ├── admin/runs/page.tsx
│   └── api/
│       ├── courses/route.ts
│       ├── courses/[slug]/route.ts
│       └── cron/daily/route.ts
├── components/
│   ├── DailyHero.tsx
│   ├── CourseCard.tsx
│   ├── LessonReader.tsx
│   ├── QuizBlock.tsx
│   ├── LibraryFilters.tsx
│   ├── TopicChip.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ConsentBanner.tsx
│   └── GAScript.tsx
├── lib/
│   ├── mongo.ts              // cached client (claudeai pattern)
│   ├── supabase.ts           // browser + server clients
│   ├── middleware.ts         // allowlist gate
│   ├── s3.ts                 // explicit S3_REGION pin
│   ├── schema.ts             // Zod: Course, Lesson, QuizQuestion
│   ├── generate-course.ts    // Claude prompt chain
│   ├── runware.ts            // FLUX + Seedance wrappers
│   ├── usage.ts              // append to ~/APPS/appai/docs/usage.md
│   └── slugify.ts
├── middleware.ts             // route gate on /admin/**
└── tests/
    ├── schema.test.ts
    ├── mongo.test.ts
    ├── generate-course.test.ts
    └── cron-daily.test.ts
```

## Library notes

### `src/lib/mongo.ts` — cached client + FLEET helpers

Reuse the claudeai pattern (per `reference_claudeai_repo`): module-scoped
client cached across hot-reloads using `globalThis`. Single connection
per Node lambda, reuses across cold starts in the same warm pod.

```ts
declare global {
  // eslint-disable-next-line no-var
  var __cad_mongo: MongoClient | undefined;
}

async function fleetDb() {
  if (!global.__cad_mongo) {
    global.__cad_mongo = new MongoClient(process.env.MONGODB_URI!);
    await global.__cad_mongo.connect();
  }
  return global.__cad_mongo.db(process.env.MONGODB_DB ?? "FLEET");
}

// Always returns the FLEET.lists collection, filtered to {app:'cad'}
// via the helpers below — never leak cross-app reads.
const APP = process.env.CAD_APP_ID ?? "cad";
const KIND = process.env.CAD_LISTS_KIND ?? "course";

export async function lists() {
  return (await fleetDb()).collection("lists");
}

export async function findCourse(slug: string) {
  return (await lists()).findOne({ app: APP, kind: KIND, _id: slug });
}

export async function listCourses({ limit = 24, before }: { limit?: number; before?: Date }) {
  const q: Record<string, unknown> = { app: APP, kind: KIND };
  if (before) q.created_at = { $lt: before };
  return (await lists()).find(q).sort({ created_at: -1 }).limit(limit).toArray();
}

export async function upsertCourse(course: Course) {
  return (await lists()).replaceOne(
    { _id: course._id },
    { ...course, app: APP, kind: KIND },   // discriminator always set
    { upsert: true },
  );
}

export async function logRun(run: { job: string; started_at: Date; ok: boolean; error?: string }) {
  const db = await fleetDb();
  return db.collection("runs").insertOne({ app: APP, ...run });
}
```

**Discriminator invariant:** every write into `FLEET.lists`, `FLEET.runs`,
`FLEET.daily_pick`, `FLEET.media`, etc. **must** include `app:'cad'`. The
helpers above enforce this so app code can't forget. `/abc-mongo doctor`
samples FLEET and fails loud if any sampled doc is missing `app` — so the
invariant gets tested in CI before deploy.

### `src/lib/s3.ts` — explicit region

```ts
const client = new S3Client({
  region: process.env.S3_REGION ?? "eu-west-2",  // never trust AWS_REGION on Vercel
});
```

### `src/lib/middleware.ts` — allowlist gate

Mirrors the yb100 / fs middleware: anonymous on `/admin/**` → 302
`/login`; logged-in but not on `ADMIN_ALLOWLIST` → 401. Must guard for
empty Supabase env vars or the first prod request 500s the whole site
including the public surface (per `feedback_supabase_middleware_env_guard`).

### `src/lib/schema.ts` — Zod schemas

Source of truth for the Course / Lesson / Quiz shape. Mongo docs are
validated on read AND write. Same shape mirrors
`~/courses/backend/app/models.py` field names where overlap exists
(`tagline`, `rank`, `key_ideas`).

### `src/lib/generate-course.ts` — prompt chain

Single-shot Claude call to Sonnet 4.6. Prompt template includes:
- The dedupe list (today − 90 days of titles + topics from `FLEET.lists` where `app:'cad'`)
- The schema as JSON-schema appendix
- A one-line topic hint from the admin (optional)
- Output constraint: valid JSON only, no prose

The result is parsed by Zod; failure → retry once with the error
message in the system prompt; second failure → 500 from the cron route,
logged to `/admin/runs`.

## Data model (Mongo — FLEET shape)

CAD does **not** have a dedicated collection. Per
`~/APPS/appai/docs/MONGO-FLEET-SCHEMA.md`, every course is one doc in
`FLEET.lists` with `{app:'cad', kind:'course'}` as the discriminator pair.

```js
// FLEET.lists — one doc per CAD course
{
  _id: "cad-2026-06-17",         // = slug, natural key
  app: "cad",                    // FLEET discriminator
  kind: "course",                // sub-type within FLEET.lists
  slug: "cad-2026-06-17",        // mirrors _id (FLEET-SCHEMA unique on {app,slug})
  date: "2026-06-17",
  title: "Negotiating With Suppliers",
  tagline: "Lock better terms without burning the relationship.",
  topic: "business",
  description: "...",
  cover_url: "https://com27.s3.eu-west-2.amazonaws.com/cad/2026-06-17/cover.jpg",
  intro_url: "https://com27.s3.eu-west-2.amazonaws.com/cad/2026-06-17/intro.mp4",
  lessons: [
    {
      rank: 1,
      title: "Why the anchor matters",
      key_ideas: ["...", "..."],
      body_md: "...",
      duration_min: 2
    },
    // 10–15 total
  ],
  quiz: [
    {
      rank: 1,
      prompt: "...",
      choices: ["...", "...", "...", "..."],
      answer_index: 2,
      explanation: "..."
    },
    // 5 total
  ],
  duration_min: 18,
  seed: false,
  source: "claude",
  created_at: ISODate("2026-06-17T00:05:23Z"),
  meta: {
    model: "claude-sonnet-4-6",
    prompt_version: 1,
    run_id: "01HZ..."
  }
}
```

Cron runs go to `FLEET.runs` with `{app:'cad', job:'daily', started_at}`.
Daily picks (today's featured course) go to `FLEET.daily_pick` with
`{app:'cad', for_date}`.

**Indexes (already exist on FLEET via `/abc-mongo fleet init`):**
- `{app:1, slug:1}` unique — selects CAD courses by slug
- `{app:1, created_at:-1}` — recency-sorted reads for `/library`
- Text index on `title + tagline + description + lessons.title` (added per-CAD)

**Query patterns:**
```js
// Today's course
db.lists.findOne({ app:'cad', kind:'course', _id:`cad-${today}` })

// Library, paginated
db.lists.find({ app:'cad', kind:'course' })
  .sort({ created_at: -1 })
  .limit(24)

// Search
db.lists.find({ app:'cad', kind:'course', $text:{$search:q} })
```

## API surface

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/courses?date=YYYY-MM-DD&limit=24&cursor=...&topic=...&q=...` | none | List for `/library` |
| GET | `/api/courses/[slug]` | none | Single course |
| POST | `/api/cron/daily` | `Authorization: Bearer ${CRON_SECRET}` | Trigger daily generation. Body: `{ dryRun?: boolean, force?: boolean, topic?: string }` |
| GET | `/api/admin/runs` | session + allowlist | Last 30 cron runs (read from `FLEET.runs` where `{app:'cad', job:'daily'}`) |
| POST | `/api/admin/regen` | session + allowlist | Calls `/api/cron/daily?force=true` server-side |

`/api/cron/daily` is **idempotent on `_id`** — re-runs overwrite the same
Mongo doc and overwrite the same S3 prefix. Force re-gen by passing
`force: true` (otherwise an existing same-date doc short-circuits).

## Testing

- `vitest run` against `src/tests/*.test.ts` — schema, mongo helper,
  generate-course (with mocked Anthropic client), cron route handler
- `playwright test` — smoke pass on `/`, `/library`, `/course/<seeded-slug>`
- TDD red-green sequence locked in `goal-2026-06-16-cad.md` BACKLOG 001-009

## Performance budget

| Surface | Target |
|---|---|
| `/` LCP | < 1.5s on 4G mobile |
| `/library` initial paint | < 2s with 30 cards |
| `/course/[slug]` first lesson visible | < 1s |
| `/api/courses` p99 | < 200ms |
| Daily cron full run | < 90s (Claude ~ 25s, FLUX ~ 15s, Seedance ~ 30s, S3 < 5s) |
| Lighthouse perf + a11y | ≥ 90 on `/`, `/library`, `/course/<slug>` |
