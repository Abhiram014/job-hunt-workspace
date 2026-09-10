# Job Hunt Workspace

A full-stack job-search command center that replaces the spreadsheet-plus-sticky-notes workflow most people use to manage a job search: an application tracker, a resume library with version history, an AI resume assistant, and a lightweight CRM for recruiter and referral contacts — all in one place, all backed by a real database.

**Live app:** [job-hunt-workspace-three.vercel.app](https://job-hunt-workspace-three.vercel.app) *(registration is invite-only — ask for a code, or run your own copy locally, see below)*

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000)](https://vercel.com/)

---

## What it does

- **Track every application** through a full pipeline — saved, applied, online assessment, recruiter screen, technical/onsite interviews, offer, rejected — in a sortable table or a drag-and-drop Kanban board.
- **Import jobs automatically.** Paste a job posting URL and a pluggable extractor (Greenhouse, Lever, Ashby, or a JSON-LD/generic fallback) pulls out the title, company, location, salary, and description for you to review before saving. Paste a raw job description instead and a heuristic parser does the same.
- **Manage a versioned resume library.** Upload PDFs/DOCX/text or paste content directly; every edit creates a new version rather than overwriting history, and every application records the *exact* resume version that was submitted to it.
- **Get AI help tailoring your resume to a specific job.** An internal (clearly-labeled, not "official ATS") match score, missing-keyword analysis, and a side-by-side resume tailoring flow where you accept or reject each suggested edit individually before saving a new version — with hard guardrails against fabricating experience, employers, or credentials.
- **Chat with an AI assistant** scoped to a specific job or resume, with full conversation history saved permanently.
- **Run a lightweight CRM** for recruiters, referrals, and interview contacts, plus follow-up reminders that surface on the dashboard.
- **See the whole search at a glance** — a dashboard with KPIs, applications-over-time and by-status/company/role charts, interview and offer conversion rates, and a resume-performance table showing which resume version actually gets interviews.

## Architecture highlights

This wasn't built as a CRUD toy — a few design decisions were made specifically so the system could grow without rewrites:

- **`JobExtractor` adapter pattern** (`src/lib/extractors/`): each ATS (Greenhouse, Lever, Ashby) gets its own extractor behind a shared interface, with a JSON-LD/generic fallback for everything else. Adding a new job board means adding one file, not touching the import flow.
- **`StorageProvider` abstraction** (`src/lib/storage/`): resume files are written through an interface with two implementations — local disk for development, private Vercel Blob storage in production — selected automatically by environment. The app code never knows which one is active.
- **`LLMProvider` abstraction** (`src/lib/ai/`): AI calls go through a provider interface with a Claude implementation using structured outputs (Zod-typed responses, not fragile prompt-and-parse). Swapping or adding a model provider doesn't touch the calling code.
- **Immutable resume history**: resume edits and AI tailoring never overwrite a version that's already been submitted to an application — a new version is created instead, so "which resume did I actually send to Stripe?" always has a real answer.
- **SSRF-guarded URL fetching**: the job-import fetcher resolves and validates target hosts before requesting them, rejecting private/internal IP ranges.
- **Edge-safe auth split**: the NextAuth config is split into an edge-compatible base (used by middleware, which runs on Vercel's size-constrained Edge runtime) and a full Node.js config (Prisma + bcrypt) used everywhere else.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling / UI | Tailwind CSS v4, shadcn/ui (Radix primitives) |
| Database | PostgreSQL (Neon), Prisma ORM |
| Auth | NextAuth v5, credentials + bcrypt |
| File storage | Vercel Blob (production), local disk (dev) |
| AI | Anthropic API (Claude), structured outputs via Zod |
| Validation | Zod on every server action and API route |
| Deployment | Vercel, auto-deployed from GitHub on push |

## Getting started (run it locally)

```bash
git clone https://github.com/Abhiram014/job-hunt-workspace.git
cd job-hunt-workspace
npm install
```

Create a `.env` file (see [Environment variables](#environment-variables) below), then:

```bash
npx prisma migrate dev   # creates the database schema
npx prisma db seed       # loads realistic demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the seeded demo account:

- **Email:** `demo@jobhunt.dev`
- **Password:** `password123`

Registration is open by default in local dev (no invite code needed unless you set one yourself).

### Resuming work after closing everything

Nothing needs to be "kept running" — the database and file storage are cloud-hosted, not local processes. To come back and develop later:

```bash
cd job-hunt-workspace   # wherever you cloned it
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). That's it — `.env` already has your database and API connection details from last time, so there's no re-setup step. (The live production app at the link above needs nothing at all — it's already running on Vercel independent of your machine.)

### Environment variables

```env
DATABASE_URL="postgresql://..."          # or "file:./dev.db" for local SQLite — see note below
DATABASE_URL_UNPOOLED="postgresql://..." # Neon's direct connection, used by prisma migrate
NEXTAUTH_SECRET="<any random string>"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY=""        # optional — get one at console.anthropic.com to enable AI features
ANTHROPIC_MODEL=""          # optional override, defaults to claude-opus-5
SIGNUP_INVITE_CODE=""       # optional — unset means open registration (the local default)
BLOB_READ_WRITE_TOKEN=""    # optional — unset falls back to local-disk file storage
```

Without `ANTHROPIC_API_KEY`, the AI pages render normally and clearly state they aren't configured — there are no dead buttons.

**Prefer SQLite over Postgres for local dev?** Change `provider` to `"sqlite"` in `prisma/schema.prisma`'s `datasource` block, remove the `directUrl` line, delete `prisma/migrations/`, and run `npx prisma migrate dev` to generate a fresh SQLite migration. Nothing else in the app changes.

## Project structure

```
prisma/schema.prisma       Full data model — users, applications, resumes + versions,
                            notes, contacts, interviews, followups, activity log,
                            job imports, AI conversations/messages
prisma/seed.ts              Realistic demo data (Stripe, Capital One, Datadog, ...)
src/app/(dashboard)/...     Authenticated pages: dashboard, applications, resumes,
                            AI workspace, contacts, analytics, settings, search
src/app/api/...             Route handlers: auth, job import, resume file serving
src/app/actions/...         Server actions (Zod-validated, scoped per user)
src/components/...          UI components, grouped by feature
src/lib/ai/                 LLMProvider interface + Anthropic implementation
src/lib/extractors/         JobExtractor interface + Greenhouse/Lever/Ashby/generic
src/lib/storage/            StorageProvider interface + local-disk/Vercel Blob
src/lib/security/           SSRF guard for URL imports
src/lib/auth.config.ts      Edge-safe NextAuth config (used by middleware)
src/lib/auth.ts             Full NextAuth config (Node.js runtime)
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also runs pending migrations) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |
| `npx prisma studio` | Browse the database visually |
| `npx prisma db seed` | Reset demo data |

## Roadmap

Phases 1 (tracker/CRM) and 2 (AI assistant) are complete. Not yet built:

- **Phase 3**: deeper interview prep tooling, richer CRM views
- **Phase 4**: a browser extension for one-click job capture — the backend already exposes `POST /api/jobs/import` in the shape this needs

## License

MIT — see [LICENSE](LICENSE).
