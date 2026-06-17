# 01 · Product PRD

## Vision

**One fresh AI-generated course per day, forever, free to consume.**

CAD (Course A Day) is the courses-shaped entry in the ABC "X A Day"
family — LAD (lists), IAD (images), PAD (posts), CAD (courses). It
removes the cold-start problem from learning: every day the library has
something new to read, and the back-catalogue is searchable.

The engine is **generic** — Claude picks any topic that hasn't been done
before. The first 30 days are **seeded** with business-English content
ported from `~/courses/_original/` so the library opens with real material.

## Problem & opportunity

| | |
|---|---|
| **Today** | Adults wanting to learn something have to commit to a 20-hour Udemy course, a 6-week MOOC, or an overpriced book. Topic discovery is friction-heavy; commitment-to-start is the real cost. |
| **CAD** | Daily 15-minute course. Today's topic is whatever Claude picked at 00:05 UTC. If you like it you spend 15 minutes; if not, tomorrow's topic is already queued. |
| **Why now** | Claude Sonnet 4.6/4.7 generates coherent multi-lesson syllabi in one prompt. Runware FLUX + Seedance generates the cover + intro loop for ~$0.05. Daily total cost ≈ $0.20 → fits the fleet's $1/day/site monetisation cap. |

## Users

| Role | Description | Auth | Surface |
|---|---|---|---|
| **Anonymous reader** | Lands from search / share, reads today's course or any past course | none | `/`, `/library`, `/course/[slug]` |
| **Returning learner** | Tracks lessons completed across courses | Supabase magic-link | adds `/me` (progress) — post-v1 |
| **Admin** | Mat (only) — preview tomorrow's draft, force-regen, edit metadata | Supabase + allowlist | `/admin` |

## Entities

```
Course
├── _id           cad-YYYY-MM-DD                   (also the slug)
├── date          ISO date string
├── title         "Negotiating With Suppliers"
├── tagline       short hook, ≤ 120 chars
├── topic         high-level category (business, lang, code, …)
├── description   2-3 paragraphs
├── cover_url     s3://com27/cad/YYYY-MM-DD/cover.jpg
├── intro_url     s3://com27/cad/YYYY-MM-DD/intro.mp4 (optional)
├── lessons       Lesson[]                          (10–15)
├── quiz          QuizQuestion[]                    (exactly 5)
├── duration_min  total est. minutes
├── seed          boolean — true for the 8 ported courses
├── source        "claude" | "courses-original"
└── meta          { model, prompt_version, generated_at, run_id }

Lesson
├── rank          1-based
├── title
├── key_ideas     string[] (3-6 bullets, ported from ~/courses shape)
├── body_md       full lesson body in markdown
└── duration_min

QuizQuestion
├── rank          1-5
├── prompt
├── choices       string[] (4 — one correct)
├── answer_index  0-3
└── explanation
```

The shape **echoes** `~/courses/backend/app/models.py` (Pydantic
CourseSession with key_ideas + tagline + rank) so the seed-business-edu
script can do a near-direct port. The Mongo `_id` doubles as the URL
slug — same trick yb100 uses for its daily lists.

## Pricing posture

- **v1** — free. Everything readable. No login required to read.
- **v2** — `/me` progress tracking gated by free Supabase magic-link
  signup. Email captures fuel the daily digest (Resend).
- **v3** — Stripe "Pro" tier (£3/mo) unlocks: lesson audio
  (TTS-generated), printable PDF, certificate of completion on quiz
  pass. Pricing follows the fleet $1/day/site monetisation cap once
  organic traffic warrants.

## Competitor landscape

| Player | Their bet | CAD's angle |
|---|---|---|
| **Coursera / edX** | Credentialed, instructor-led, expensive | Free, no commitment, AI-native |
| **LinkedIn Learning** | Skills-as-resume, B2B sales | Personal curiosity, SEO long-tail |
| **Udemy** | Long-form, instructor inventory | Daily, 15-min, no instructor |
| **Daily-X newsletters** | Email is the product | Library is the product, email is the digest |

CAD does **not** compete on credentialing. The bet is SEO long-tail
("how do I X") × daily-cadence × free-to-read.

## Success metrics (post-v1)

| Metric | Target by 2026-12-31 |
|---|---|
| Courses in library | 200+ (30 seed + 180 daily) |
| Cron success rate | ≥ 95% (1 miss/month tolerated) |
| Daily cost per course | ≤ $0.20 (Claude + Runware) |
| Organic monthly visitors | 5,000 |
| `/me` signups | 200 |
| Lighthouse perf + a11y | ≥ 90 on `/`, `/library`, `/course/[slug]` |

## What CAD is NOT

- Not a credentialed course platform. No certificates in v1.
- Not interactive. No videos beyond the 5s intro loop. No live sessions.
- Not user-generated. Claude writes the courses; the admin curates.
- Not multi-language at v1 (English only — i18n is post-v1).

## Non-goals for v1

- Stripe paywall (deferred to v3 — referenced in `goal-2026-06-16-cad.md`
  but not in BACKLOG-009)
- Custom domain `cad.<tld>` (defer until the Vercel auto-alias is stable)
- Resend daily digest (deferred to v2)
- Mobile native app
- Comments / forum / community
