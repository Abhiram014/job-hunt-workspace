# Job Hunt Workspace

A centralized job-search workspace: application tracker, resume library, AI resume assistant, and lightweight CRM — built with Next.js, Prisma, NextAuth, and the Anthropic API.

**Live:** https://job-hunt-workspace-three.vercel.app (invite-only registration — see below)

## Status

**Phase 1 (tracker/CRM) and Phase 2 (AI) are implemented and deployed.** Phase 3 (deeper CRM polish) and Phase 4 (browser extension) are not started — `/api/jobs/import` is already shaped for the extension flow.

**Phase 1**: auth, dashboard, application tracker (table + Kanban), application detail workspace, notes, resume library with versioning, job import (URL scraping via a Greenhouse/Lever/Ashby/generic extractor adapter, plus paste-JD heuristics), contacts CRM, interviews, follow-ups, activity timeline, analytics, global search, light/dark mode.

**Phase 2 (AI, requires `ANTHROPIC_API_KEY`)**: match analysis (internal heuristic score, keyword gaps, skills coverage), resume tailoring with per-change accept/reject and side-by-side preview before saving as a new resume version, and job-scoped AI chat with persisted conversation history. Available from the standalone `/ai` page and from each application's "AI Workspace" tab. Not enabled on the live deployment yet — no `ANTHROPIC_API_KEY` set there.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (Radix-based, pinned to `shadcn@3.8.5` — the CLI's `latest` tag currently generates Base UI components which is a bigger migration than this project needs) · Prisma 6 + PostgreSQL (Neon, via Vercel's marketplace integration in production; SQLite works too for local-only dev — see below) · NextAuth v5 (credentials provider, bcrypt; auth config split into an edge-safe base (`lib/auth.config.ts`) and the full Node.js config (`lib/auth.ts`) so middleware stays under Vercel's Edge Function size limit) · next-themes for light/dark mode · Zod validation on every server action and API route · file storage behind a `StorageProvider` interface — Vercel Blob (private access) in production, local disk for dev — picked automatically based on whether `BLOB_READ_WRITE_TOKEN` is set · an `LLMProvider` interface (`src/lib/ai/provider.ts`) with an Anthropic implementation using `claude-opus-5` and structured outputs (`messages.parse` + Zod schemas) for match analysis and tailoring.

## Deployment

Hosted on **Vercel**, database on **Neon** (Postgres, via Vercel's marketplace integration), file storage on **Vercel Blob** (private). The GitHub repo is connected to the Vercel project, so every push to `main` deploys automatically — `npm run build` runs `prisma migrate deploy` first, so schema changes ship automatically too.

Registration on the live site requires an invite code (`SIGNUP_INVITE_CODE`, set as a Vercel env var) — without this, anyone who found the URL could sign up and start burning the deployer's Anthropic API quota. Ask the site owner for the code, or run your own copy locally (see below) where registration is open by default.

## Getting started (local dev)

```bash
npm install
npx prisma migrate dev   # creates a local database from prisma/migrations
npx prisma db seed       # loads demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with the seeded demo account:

- **Email:** `demo@jobhunt.dev`
- **Password:** `password123`

Or register a new account from `/register` — each user's data is isolated. Registration is open locally unless you set `SIGNUP_INVITE_CODE` yourself.

### Environment variables (`.env`)

```
DATABASE_URL="postgresql://..."          # or "file:./dev.db" for local SQLite (see note below)
DATABASE_URL_UNPOOLED="postgresql://..." # Neon's direct (non-pgbouncer) connection, used by prisma migrate
NEXTAUTH_SECRET="<any random string>"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY=""        # required for AI features — get one at console.anthropic.com
ANTHROPIC_MODEL=""          # optional override, defaults to claude-opus-5
SIGNUP_INVITE_CODE=""       # optional — unset means open registration (default for local dev)
BLOB_READ_WRITE_TOKEN=""    # optional — unset falls back to local-disk file storage
```

**Using SQLite instead of Postgres for local dev:** change the `provider` in `prisma/schema.prisma`'s `datasource` block back to `"sqlite"`, drop the `directUrl` line, delete `prisma/migrations/`, and run `npx prisma migrate dev` to generate a fresh SQLite-dialect migration. The rest of the app is unaffected either way.

Without `ANTHROPIC_API_KEY` set, the AI pages render normally and clearly show "not configured" — no broken or fake buttons. Any AI action attempted without a key fails with a friendly error toast; nothing crashes and nothing already typed is lost (e.g. a chat message you send is still saved even if the model call fails).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — `prisma generate && prisma migrate deploy && next build` (matches what Vercel runs)
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type check
- `npx prisma studio` — browse the database
- `npx prisma db seed` — reset demo data (re-seeding clears and rebuilds only the demo user's data — note this generates new IDs, so bookmarked `/applications/<id>` URLs from before a reseed will 404)

## Known limitations

- **File storage** uses Vercel Blob in production (private access, reads proxied through an authenticated route) and local disk in dev — see `src/lib/storage/`.
- **Job URL scraping is best-effort.** Sites that render with client-side JavaScript (LinkedIn, Workday, Indeed) will often yield partial or empty results from the `GenericExtractor` fallback, since nothing here executes JavaScript — this is called out in the UI.
- **Paste-JD parsing uses simple heuristics**, not AI.
- **AI rate limiting is in-memory** (`src/lib/ai/rate-limit.ts`, 20 requests/5 min per user) — this does *not* work correctly across Vercel's serverless instances (each cold start gets fresh memory), so it's a soft, best-effort limit in production, not a hard cap. A real deployment expecting abuse would need a shared store (Redis/Upstash).
- **Match analysis and chat aren't cost-optimized** (no prompt caching yet) — fine for personal use; worth adding if usage grows.
- **No total-spend cap.** Invite-gating signups limits *who* can use AI features, but not how much a signed-up user can spend on the deployer's Anthropic key beyond the per-user rate limit above.
- The `middleware.ts` file convention is deprecated in Next.js 16 in favor of `proxy.ts`; left as-is since it still works and the new convention is too recent to migrate confidently without documentation.

## Project structure

```
prisma/schema.prisma       Full data model (users, applications, resumes + versions,
                            notes, contacts, interviews, followups, activity, job imports,
                            conversations/messages)
prisma/seed.ts              Demo data (Stripe, Capital One, Datadog, Moffitt Cancer Center, ...)
src/app/(dashboard)/...     Authenticated pages (dashboard, applications, resumes, ai,
                            contacts, analytics, settings, search)
src/app/api/...             Route handlers: auth, job import (extension-ready), resume files
src/app/actions/...         Server actions (mutations), Zod-validated, scoped by userId
src/components/...          UI, grouped by feature (applications/, resumes/, ai/, layout/, ...)
src/lib/ai/                 LLMProvider interface, Anthropic implementation, prompts/guardrails,
                            rate limiting
src/lib/extractors/...      JobExtractor adapter interface + Greenhouse/Lever/Ashby/Generic
src/lib/security/           SSRF guard for the URL-import fetch
src/lib/storage/            StorageProvider interface + local-disk and Vercel Blob implementations
src/lib/services/           Query/aggregation helpers (dashboard stats, activity logging)
src/lib/auth.config.ts      Edge-safe NextAuth base config (used by middleware.ts)
src/lib/auth.ts             Full NextAuth config (Credentials provider, Prisma, bcrypt)
```
