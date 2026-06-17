# 05 · Prod Deployment

## Hosts & services

| Service | Provider | Scope | Notes |
|---|---|---|---|
| App | Vercel | `matsiems` team (`team_xW8X8CreHT9RkB9uuyZD5GcR`) | Per `feedback_vercel_scope_matsiems` — never link to cleverfox-71aa03f5. |
| Repo | GitHub | `flexappdev/cad` | Public repo. Workflow secrets sync via `/abc-github`. |
| Database | MongoDB Atlas | Central cluster (shared) | `FLEET.lists` with `{app:'cad', kind:'course'}` per `MONGO-FLEET-SCHEMA.md`. FLEET collections + indexes provisioned cluster-wide by `/abc-mongo fleet init` — CAD doesn't create its own. |
| Auth | Supabase | New project under `cleverfox` org | Magic-link only. Allowlist on middleware. |
| Object store | AWS S3 | `com27` bucket (eu-west-2) | `cad/` prefix; public-read via `PublicReadCad` policy stanza. |
| LLM | Anthropic | matsiems API key | Sonnet 4.6/4.7. |
| Image / video | Runware | matsiems key | FLUX + Seedance entitlements. |
| Email (v2) | Resend | matsiems key | Daily digest. |
| Analytics | GA4 | matsiems property | New measurement id; activate via `/abc-ga sync cad G-XXXX`. |
| Cron | `/abc-fleet-loop` | local + Vercel Cron mirror | 00:05 UTC daily. |

## First-time setup (day 0 — by an agent or human)

```bash
# 1. GitHub repo
gh repo create flexappdev/cad --public --source ~/APPS/cad --push

# 2. Vercel link + first deploy
cd ~/APPS/cad
vercel link --scope matsiems --yes --non-interactive   # NB: --non-interactive is required, per feedback_vercel_link_non_interactive
vercel --prod                                          # first deploy = link grace

# 3. Env sync — from .env.local → Vercel prod
/abc-vercel sync env cad
# then PATCH NEXT_PUBLIC_APP_URL to the prod alias, NOT localhost
# (per feedback_next_public_app_url_prod)

# 4. Supabase
/abc-supabase init cad                # new project, magic-link enabled
/abc-supabase sync env cad            # NEXT_PUBLIC_SUPABASE_URL / ANON_KEY
/abc-supabase migrate cad             # apply supabase/migrations/

# 5. Mongo
/abc-mongo ping cad                   # confirms FLEET reachable
/abc-mongo cad stats                  # shows count of FLEET docs where app='cad'
# manual:  mongo shell → use AIDB → db.createCollection("cad")
# manual:  set indexes — { date: -1 }, text on title+tagline+description,
#          { topic: 1, date: -1 }

# 6. S3 bucket policy — add PublicReadCad stanza (mirrors xmas, per
#    feedback_com27_bucket_policy)
aws s3api get-bucket-policy --bucket com27 > /tmp/policy.json
# … edit, add the stanza below …
aws s3api put-bucket-policy --bucket com27 --policy file:///tmp/policy.json

# 7. GA4
/abc-ga sync cad G-XXXXXXXXXX

# 8. Cron
/abc-fleet-loop register cad daily 00:05  # also mirror as Vercel cron in vercel.json

# 9. Seed business-edu day 1-8
pnpm seed
```

### S3 bucket policy stanza — `PublicReadCad`

```json
{
  "Sid": "PublicReadCad",
  "Effect": "Allow",
  "Principal": "*",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::com27/cad/*"
}
```

Append to the `com27` bucket policy alongside the existing
`PublicReadYb100`, `PublicReadXmas`, `PublicReadFi`, etc. stanzas.

## Supabase migrations

`supabase/migrations/0001_progress.sql` — v2 only, included as a stub
in v1 so the repo is ready:

```sql
-- progress tracking for /me dashboard (v2)
create table if not exists cad_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  course_id    text not null,
  lessons_done int[] not null default '{}',
  quiz_score   int,
  last_seen    timestamptz not null default now(),
  primary key (user_id, course_id)
);
create index if not exists cad_progress_last_seen on cad_progress(last_seen desc);
alter table cad_progress enable row level security;
create policy "self" on cad_progress
  for all using (auth.uid() = user_id);
```

Apply via `/abc-supabase migrate cad` once v2 is on deck.

## Vercel project

- **Project name** — `cad`
- **Framework** — Next.js
- **Node version** — 22 (fleet default)
- **Build command** — `pnpm build` (default Next config picks this up)
- **Output directory** — `.next`
- **Install command** — `pnpm install`
- **Custom build env** — `NODE_OPTIONS=--max-old-space-size=4096` if
  build OOMs (per `feedback_xmas_build_oom`)

### `vercel.json` — cron mirror (optional)

If we want a Vercel-managed cron alongside `/abc-fleet-loop`:

```json
{
  "crons": [
    { "path": "/api/cron/daily", "schedule": "5 0 * * *" }
  ]
}
```

The two crons are idempotent on `_id` so running both is harmless —
keep both for redundancy (Vercel cron if `/abc-fleet-loop` host is down,
and vice versa).

## GitHub Actions (`/abc-github` managed)

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | PR | `pnpm typecheck && pnpm lint && pnpm test` |
| `e2e.yml` | PR + nightly | `pnpm test:e2e` |
| `deploy.yml` | push to main | Vercel auto-handles; this workflow is a smoke-test post-deploy |
| `daily.yml` | cron 00:05 UTC | Backup trigger for `/api/cron/daily` if Vercel cron is paused |

Secrets synced from `~/context-2026/agents/.env` via `/abc-github
sync secrets cad`.

## DNS & custom domain

- v1 — stick with the auto-alias `cad-<adjective>.vercel.app`. Memory
  note `feedback_vercel_alias_protection` says custom `alias set`
  values on cleverfox scope hit 401; not relevant on `matsiems` scope
  but the auto-alias is still simpler.
- Post-v1 — wire `cad.<fleet-tld>` via `/abc-subdomain`.

## Monitoring

- **Vercel observability** — runtime logs + cron success/failure on
  the project dashboard
- **`/admin/runs`** — 30-day cron history with cost ledger, surfaced in
  the app itself
- **`~/APPS/appai/docs/usage.md`** — fleet-wide cost log, ticks on every
  daily run via `/abc-usage`
- **GA4 RealTime** — verifies the GA tag fires post-deploy

## Cost envelope

| | Per day | Per month (30) |
|---|---|---|
| Anthropic (course) | $0.05 | $1.50 |
| FLUX cover | $0.02 | $0.60 |
| Seedance intro | $0.10 | $3.00 |
| Vercel (Hobby/Pro share) | ~$0.00 | $0.00 (included) |
| S3 storage + egress | ~$0.001 | ~$0.03 |
| Mongo Atlas (shared) | ~$0.00 | $0.00 (included) |
| **Total** | **~ $0.18** | **~ $5.15** |

Well under the fleet $1/day/site monetisation cap. Headroom for the
upgrade to Opus 4.7 ($0.30/course) if quality demands it.

## Backup / disaster recovery

- **Mongo** — central Atlas cluster snapshots are taken automatically;
  CAD inherits the global retention policy. Per-course recovery is
  trivial: the `cad/<date>/syllabus.json` on S3 is a full restore source.
- **S3** — versioning enabled on com27 (fleet default). Accidental
  overwrite from a re-run is recoverable.
- **Supabase** — magic-link only, no content stored. Resetting the
  project loses the v2 progress table only; not v1-critical.

## Rollback playbook

```bash
# Vercel — instant rollback to previous deployment
vercel rollback --scope matsiems --yes

# Mongo — restore one course from S3
aws s3 cp s3://com27/cad/2026-06-17/syllabus.json -
mongosh "$MONGODB_URI" --eval 'db.cad.replaceOne({_id:"cad-2026-06-17"}, JSON.parse(cat /tmp/syllabus.json))'

# Cron — pause via Vercel UI / unregister via /abc-fleet-loop pause cad
```

## Pre-launch UAT checklist

(Mirrors the UAT block in `goal-2026-06-16-cad.md`.)

- [ ] `pnpm dev` on http://localhost:15011 — today's course or empty state
- [ ] `pnpm test` — all green
- [ ] `pnpm seed` — 8 seed courses populate `/library`
- [ ] `pnpm daily --dry-run` — prints JSON, no Mongo / S3 writes
- [ ] `pnpm daily` — writes Mongo + S3, idempotent on rerun
- [ ] `/admin` → 401 when logged out; admin tabs render when allowlisted
- [ ] Vercel prod URL — `G-XXXX` appears 3× in served HTML
- [ ] `/api/cron/daily` accepts the `CRON_SECRET` bearer; rejects missing
- [ ] `/library` text search returns hits for "negotiation"
- [ ] Lighthouse `/`, `/library`, `/course/[slug]` ≥ 90 perf + a11y
