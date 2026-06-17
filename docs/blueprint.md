# CAD Blueprint v0.1 · 2026-06-16

Comprehensive snapshot of CAD (Course A Day) — detailed enough that a fresh
Claude Code agent could replicate the system in the same stack
(Next.js 15 + React 19 + Supabase + MongoDB + S3) or migrate it to another
(e.g. Next.js + FastAPI + Postgres + AWS).

Modelled after the [AIOS blueprint format](~/CF/aios/docs/blueprints/blueprint-v-0.2.md),
compressed from 14 sections to 5.

---

## Index

| # | Section | Doc |
|---|---|---|
| 01 | **Product / PRD** — vision, users, entities, business model | [01-product-prd.md](./01-product-prd.md) |
| 02 | **UX** — pages, components, journeys, a11y | [02-ux.md](./02-ux.md) |
| 03 | **Tech architecture** — stack, env contract, libs | [03-tech-architecture.md](./03-tech-architecture.md) |
| 04 | **Data flows** — daily pipeline + UI read paths | [04-data-flows.md](./04-data-flows.md) |
| 05 | **Prod deployment** — Vercel, Supabase, GA4, cron | [05-prod-deployment.md](./05-prod-deployment.md) |

The active mandate lives in [`goal-2026-06-16-cad.md`](./goal-2026-06-16-cad.md).

---

## Version history

| Version | Date | Author | Notes |
|---|---|---|---|
| 0.1 | 2026-06-16 | Claude / Mat | Initial scaffold — 7 docs, 5-section split, BACKLOG-009 in `goal-2026-06-16`. Prerequisite Mongo 500→100 cleanup tracked separately. |

---

## One-paragraph summary

CAD ships **one fresh AI-generated course per day** on any topic. The
**generic engine** runs at 00:05 UTC: Claude picks a never-done-before
topic, generates a 10–15-lesson course with a 5-question capstone, writes
to `FLEET.lists` with `{app:'cad', kind:'course', _id:'cad-YYYY-MM-DD'}`, generates a FLUX cover and
Seedance intro loop via Runware, uploads everything to `s3://com27/cad/`,
and logs the run via `/abc-usage`. The library at `/library` grows by
one course/day forever. Days 1–30 are seeded from
`~/courses/_original/*.md` (eight business-English courses) so v1 opens
with real content. The site is Next.js 15 on Vercel (matsiems scope),
auth via Supabase magic-link (allowlist-gated `/admin`), no paywall yet.

## Replication checklist

Re-implementing CAD in a new environment requires:

- [ ] Next.js 15.5.18 + React 19 + Tailwind 3.4 + TypeScript repo
- [ ] MongoDB Atlas cluster with `FLEET` DB initialized via
      `/abc-mongo fleet init` (canonical 20 collections + indexes per
      `~/APPS/appai/docs/MONGO-FLEET-SCHEMA.md`). CAD writes to
      `FLEET.lists` with `{app:'cad', kind:'course'}` — no dedicated
      collection.
- [ ] S3 bucket (or equivalent) with `cad/` prefix, public-read policy
      stanza named `PublicReadCad`
- [ ] Supabase project with allowlist column on `auth.users` (mirrors
      yb100 / fs middleware pattern)
- [ ] Anthropic API key (Claude Sonnet 4.6 or 4.7)
- [ ] Runware API key with FLUX (`runware:100@1`) + Seedance
      (`bytedance:2@2`) entitlements
- [ ] Cron runner that calls `POST /api/cron/daily` at 00:05 UTC with the
      `CRON_SECRET` bearer
- [ ] GA4 property + measurement id

## Migration notes

To swap the stack to **Next.js + FastAPI + Postgres + AWS** (the `fapi`
alternative listed in the planner):

- `src/lib/mongo.ts` → swap for `src/lib/db.ts` Postgres pool, courses
  table with JSONB `lessons`/`quiz` columns
- `src/app/api/*/route.ts` → FastAPI endpoints in a sibling `api/` repo,
  deployed to ECS Fargate or App Runner
- `src/lib/s3.ts` already vendor-neutral (AWS SDK v3); no change
- `src/lib/supabase.ts` → AWS Cognito or Clerk (allowlist-gate stays)
- Daily cron `/api/cron/daily` → EventBridge → Lambda → FastAPI invoke

No business logic crosses the swap. Course schema (`src/lib/schema.ts`)
and the prompt chain (`src/lib/generate-course.ts`) are stack-neutral.
