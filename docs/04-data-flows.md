# 04 · Data Flows

## Daily pipeline — the spine of the system

```
00:05 UTC — daily cron (Vercel Cron or /abc-fleet-loop)
        │
        ▼
POST /api/cron/daily   (Bearer ${CRON_SECRET})
  │
  ├─ 1. dedupeAndPickTopic()
  │       └─ read FLEET.lists{app:'cad'} — last 90 days of {title, topic}
  │       └─ call Claude: "pick a fresh topic, not in this list"
  │       └─ returns { topic, hint } — or 4xx if Mat sent a `topic` override
  │
  ├─ 2. generateCourse(topic, hint)
  │       └─ Claude Sonnet 4.6
  │       └─ output JSON validated by src/lib/schema.ts (Zod)
  │       └─ retry once on parse failure
  │
  ├─ 3. mongo.upsertOne({ _id: `cad-${date}` }, course, { upsert: true })
  │       └─ idempotent — overwrite is intentional (force-regen path)
  │
  ├─ 4. runware.imageGen({ model: runware:100@1, prompt: course.cover_prompt })
  │       └─ s3.put(`cad/${date}/cover.jpg`)
  │       └─ patch mongo doc with cover_url
  │
  ├─ 5. runware.videoGen({ model: bytedance:2@2, prompt: course.intro_prompt, duration: 5 })
  │       └─ s3.put(`cad/${date}/intro.mp4`)
  │       └─ patch mongo doc with intro_url
  │       └─ (best-effort — video failure does NOT fail the run; course
  │          stays without intro_url)
  │
  ├─ 6. s3.put(`cad/${date}/syllabus.json`, JSON.stringify(course))
  │       └─ public-read object — useful for RSS / external embeds
  │
  ├─ 7. mongo.insertOne(FLEET.runs, { app:'cad', job:'daily', run_id, date, status, durations,
  │                                       cost_estimate, errors })
  │
  └─ 8. /abc-usage append → ~/APPS/appai/docs/usage.md
            └─ token + POM + time + cost ledger row
```

**Timing budget (target < 90s end-to-end):**

| Step | Target | Cost estimate |
|---|---|---|
| 1 — dedupe + topic pick | 5s | $0.005 |
| 2 — course generation | 25s | $0.05 (Sonnet, ~12k output tokens) |
| 3 — Mongo upsert | < 200ms | n/a |
| 4 — FLUX cover | 15s | $0.02 |
| 5 — Seedance intro | 30s | $0.10 |
| 6 — S3 syllabus | < 500ms | n/a |
| 7 — runs log | < 200ms | n/a |
| 8 — usage log | < 100ms | n/a |
| **Total** | **< 90s** | **~ $0.18 / day** |

Fits the fleet $1/day/site monetisation cap with a 5× safety margin.

## Idempotency & retry

- `_id = cad-YYYY-MM-DD` is the natural key. Same-day reruns overwrite.
- The cron route checks for existing same-day doc unless `force: true`.
  Default behaviour: skip generation if today's doc exists, return
  `{ status: "skipped", course_id }`.
- Each step writes its own status sub-document; a partial failure leaves
  the course-level doc intact (e.g. cover failed but lessons saved →
  Mat can re-run just the media step from `/admin`).
- The cron secret is rotated via Vercel env; old secret rejection logs
  via `/admin/runs` so we can spot drift.

## Read paths

### `/` (home)

```
Server component, ISR revalidate 5 min:
  course_today = mongo.findOne({ _id: `cad-${today}` })
  recent       = mongo.find({}, { sort: { date: -1 }, limit: 6 })
                       .toArray()
  → render <DailyHero course={course_today} />
           <RecentGrid items={recent} />
```

### `/library`

```
Server-rendered first paint; client takes over for filter/search.

initial: GET /api/courses?limit=24
fetch:    cursor-based pagination ({ cursor: lastSeenDate })
search:   client → GET /api/courses?q=...&topic=...

Mongo query strategy:
  - no filter:        find({}, { sort: { date: -1 }, limit })
  - topic filter:     find({ topic }, { sort: { date: -1 }, limit })
  - text search:      find({ $text: { $search: q } }, { score: { $meta: "textScore" } })
                          .sort({ score: { $meta: "textScore" }, date: -1 })
```

### `/course/[slug]`

```
SSG with fallback ("on-demand ISR"):
  course = mongo.findOne({ _id: slug })
  → render <LessonReader course={course} />

Lesson navigation is client-side (React state, single SPA-style scroll).
Quiz state lives in component state until "submit" (no persist in v1).
```

## Write paths (post-v1)

Progress tracking — **deferred to v2**, included here for completeness:

```
POST /api/me/progress
  body: { course_id, lesson_rank, completed_at }
  auth: Supabase session cookie
  store: Supabase table `cad_progress` (auth-scoped; NOT in FLEET — per-user data stays in Supabase per FLEET-SCHEMA anti-patterns). Not in v1.
  schema: { user_id, course_id, lessons_done[], quiz_score, last_seen }
```

## External data fed in

### Seed business-edu corpus — one-shot

```
scripts/seed-business-edu.ts
  ├─ glob ~/courses/_original/*.md   (8 files)
  ├─ for each:
  │   └─ scripts/md-to-course.ts → Course doc (port of courses_json.py)
  │       └─ mongo.insertOne({ ..., seed: true, source: "courses-original",
  │                            date: 2026-05-20 + index })
  └─ (no S3 cover/intro for seed; covers come from a one-time FLUX batch)
```

The seed flag prevents the dedupe step from suggesting topics that
overlap with the seeded business-English content, and lets the
`/library` filter UI surface `seed:true` items in a "founder picks"
row.

## Logging & observability

- **Per-run log** — `FLEET.runs` insert per cron invocation with `{app:'cad', job:'daily'}`; surfaced
  at `/admin/runs`
- **Usage ledger** — `~/APPS/appai/docs/usage.md` (per
  `reference_abc_usage_skill`) — append-only, includes token / time / cost
- **Vercel logs** — runtime errors flow through; structured JSON logs
  from `/api/cron/daily` with `run_id` for trace stitching
- **Sentry** — not in v1 (skip unless we see real prod errors)
- **GA4** — page_view + `lesson_complete` (rank, course_id) +
  `quiz_complete` (score, course_id) events; Consent Mode v2

## Privacy

- Anonymous reading writes no PII anywhere
- `/me` v2 stores only Supabase `user_id` + progress JSON; no email
  duplication
- GA4 with Consent Mode v2 default-deny — no cookies until user accepts
- No third-party scripts beyond GA4 + Vercel analytics
- S3 objects under `cad/` are public-read per `PublicReadCad` policy
  stanza — content is intentionally public

## Failure modes & fallbacks

| Failure | Behaviour |
|---|---|
| Anthropic 503 / rate-limit | Retry once with exponential backoff (1s, 3s). Cron run marked `degraded`. No course written. Mat is paged via `/admin/runs` red row. |
| Runware FLUX failure | Course doc written without `cover_url`. UI shows a topic-coloured placeholder. Backfill manually from `/admin`. |
| Runware Seedance failure | Course doc written without `intro_url`. UI just doesn't show the intro loop. Non-blocking. |
| Mongo write failure | Cron route returns 500 — no S3 writes happen (S3 steps follow Mongo). Idempotent retry safe. |
| S3 PUT failure | Mongo doc has the `cover_url` pre-computed S3 URL; HEAD request from UI 404s and falls back to placeholder. |
| Missing `MONGODB_URI` env | Middleware-level guard returns "system not configured" page. Per `feedback_supabase_middleware_env_guard`, never let a missing env crash the public surface. |
