# Job Hunt Workspace

A centralized job-search workspace: application tracker, resume library, AI resume assistant, and lightweight CRM — built with Next.js, Prisma, NextAuth, and the Anthropic API.

## Status

**Phase 1 (tracker/CRM) and Phase 2 (AI) are implemented.** Phase 3 (deeper CRM polish) and Phase 4 (browser extension) are not started — `/api/jobs/import` is already shaped for the extension flow.

**Phase 1**: auth, dashboard, application tracker (table + Kanban), application detail workspace, notes, resume library with versioning, job import (URL scraping via a Greenhouse/Lever/Ashby/generic extractor adapter, plus paste-JD heuristics), contacts CRM, interviews, follow-ups, activity timeline, analytics, global search, light/dark mode.

**Phase 2 (AI, requires `ANTHROPIC_API_KEY`)**: match analysis (internal heuristic score, keyword gaps, skills coverage), resume tailoring with per-change accept/reject and side-by-side preview before saving as a new resume version, and job-scoped AI chat with persisted conversation history. Available from the standalone `/ai` page and from each application's "AI Workspace" tab.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (Radix-based, pinned to `shadcn@3.8.5` — the CLI's `latest` tag currently generates Base UI components which is a bigger migration than this project needs) · Prisma 6 + SQLite for local dev (swap the datasource for Postgres/Supabase later — the schema and app code don't change) · NextAuth v5 (credentials provider, bcrypt) · next-themes for light/dark mode · Zod validation on every server action and API route · local-disk file storage behind a `StorageProvider` interface (swap for Supabase Storage/S3 later) · an `LLMProvider` interface (`src/lib/ai/provider.ts`) with an Anthropic implementation using `claude-opus-5` and structured outputs (`messages.parse` + Zod schemas) for match analysis and tailoring.

## Getting started

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db
npx prisma db seed       # loads demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with the seeded demo account:

- **Email:** `demo@jobhunt.dev`
- **Password:** `password123`

Or register a new account from `/register` — each user's data is isolated.

### Environment variables (`.env`)

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="<any random string>"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY=""        # required for AI features — get one at console.anthropic.com
ANTHROPIC_MODEL=""          # optional override, defaults to claude-opus-5
```

Without `ANTHROPIC_API_KEY` set, the AI pages render normally and clearly show "not configured" — no broken or fake buttons. Any AI action attempted without a key fails with a friendly error toast; nothing crashes and nothing already typed is lost (e.g. a chat message you send is still saved even if the model call fails).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type check
- `npx prisma studio` — browse the database
- `npx prisma db seed` — reset demo data (re-seeding clears and rebuilds only the demo user's data — note this generates new IDs, so bookmarked `/applications/<id>` URLs from before a reseed will 404)

## Known limitations

- **Database is SQLite**, not Postgres — chosen because Docker Desktop needs WSL2 enabled on this machine, which requires a system feature change and reboot. Migrating to Postgres/Supabase later is a one-line datasource change in `prisma/schema.prisma` plus `prisma migrate`.
- **File storage is local disk** (`storage/resumes/<userId>/...`), served through an authenticated route (`/api/resumes/[id]/file`) — not yet Supabase Storage/S3, but the `StorageProvider` interface in `src/lib/storage/provider.ts` is designed for that swap.
- **Job URL scraping is best-effort.** Sites that render with client-side JavaScript (LinkedIn, Workday, Indeed) will often yield partial or empty results from the `GenericExtractor` fallback, since nothing here executes JavaScript — this is called out in the UI.
- **Paste-JD parsing uses simple heuristics**, not AI.
- **AI rate limiting is in-memory** (`src/lib/ai/rate-limit.ts`, 20 requests/5 min per user) — fine for a single dev-server instance, would need a shared store (Redis/Upstash) behind a real multi-instance deployment.
- **Match analysis and chat aren't cost-optimized** (no prompt caching yet) — fine for personal use; worth adding if usage grows.
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
src/lib/storage/            StorageProvider interface + local-disk implementation
src/lib/services/           Query/aggregation helpers (dashboard stats, activity logging)
```
