# English AI

AI-powered English learning platform for beginners through intermediate learners.

> **Status:** Sprint 1 — technical foundation only. No learning features yet.
> Product & engineering docs live in [`docs/`](./docs). Start with
> [`docs/PROJECT_STATE.md`](./docs/PROJECT_STATE.md).

## Tech Stack

| Layer     | Technology                                            |
| --------- | ----------------------------------------------------- |
| Framework | Next.js 15 (App Router), React 19                     |
| Language  | TypeScript (strict)                                   |
| Styling   | Tailwind CSS + shadcn/ui, dark mode via `next-themes` |
| Database  | PostgreSQL + Prisma ORM                               |
| Auth      | Supabase Auth _(scaffolded; wired in Sprint 3)_       |
| Tooling   | ESLint, Prettier, Husky, lint-staged                  |
| Deploy    | Vercel (web) · Railway (containerized) · Docker       |

## Prerequisites

- **Node.js 20+** (see [`.nvmrc`](./.nvmrc))
- **npm 10+**
- **Docker** (for local PostgreSQL/Redis) — optional but recommended

## 1. Installation

```bash
# Install dependencies
npm install

# Create your local env file and fill in values
cp .env.example .env

# Generate the Prisma client
npm run prisma:generate
```

## 2. Run locally

```bash
# Start local PostgreSQL + Redis (Docker)
docker compose up -d db redis

# Apply the schema to your local database (Sprint 2 onward)
npm run prisma:migrate

# Start the dev server
npm run dev
```

App runs at **http://localhost:3000**. Health check: **http://localhost:3000/api/health**.

Pages available in this sprint:

- `/` — minimal landing page
- `/login` — login placeholder (no auth logic)
- `/dashboard` — dashboard placeholder

## 3. Quality checks

```bash
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run format        # Prettier write
npm run format:check  # Prettier verify (CI)
```

Git hooks (Husky + lint-staged) run lint/format on staged files at commit time.

## 4. Build

```bash
npm run build   # prisma generate + next build (standalone output)
npm run start   # run the production build
```

## 5. Deploy

### Vercel (recommended for web)

1. Import the repo in Vercel; framework auto-detected via [`vercel.json`](./vercel.json).
2. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`.
3. Push to `main` → automatic deployment.

### Railway (containerized full stack)

1. Create a Railway project; add a **PostgreSQL** plugin.
2. Railway builds via [`Dockerfile`](./Dockerfile) (config in [`railway.json`](./railway.json)).
3. Set the same env vars; `DATABASE_URL` is provided by the Postgres plugin.
4. Health check path: `/api/health`.

### Docker (any host)

```bash
docker build -t english-ai .
docker run -p 3000:3000 --env-file .env english-ai
# or the full local stack:
docker compose --profile full up --build
```

## Project Structure

```
english-ai/
├── docs/                  # product & engineering documentation (source of truth)
├── prisma/                # Prisma schema + migrations
├── public/                # static assets
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/login/          # login placeholder
│   │   ├── (dashboard)/dashboard/ # dashboard placeholder
│   │   ├── api/health/            # health check route
│   │   ├── layout.tsx · page.tsx · globals.css
│   ├── components/        # UI components
│   │   ├── ui/            # shadcn/ui primitives (button, input)
│   │   └── theme-*.tsx    # theme provider + toggle
│   ├── config/            # site config
│   └── lib/               # utils, env, prisma, supabase clients
├── .github/workflows/     # CI (lint · type-check · build)
├── Dockerfile · docker-compose.yml
├── railway.json · vercel.json
└── package.json · tsconfig.json · tailwind.config.ts
```

## Documentation

| Doc                                                     | Purpose                 |
| ------------------------------------------------------- | ----------------------- |
| [PRODUCT.md](./docs/PRODUCT.md)                         | Vision, users, features |
| [SYSTEM_ARCHITECTURE.md](./docs/SYSTEM_ARCHITECTURE.md) | Architecture            |
| [DATABASE.md](./docs/DATABASE.md)                       | Data model              |
| [API.md](./docs/API.md)                                 | REST API spec           |
| [AI_ENGINE.md](./docs/AI_ENGINE.md)                     | AI capabilities         |
| [UI_GUIDELINE.md](./docs/UI_GUIDELINE.md)               | Design system           |
| [ROADMAP.md](./docs/ROADMAP.md)                         | 40-sprint plan          |
| [CLAUDE.md](./docs/CLAUDE.md)                           | Engineering rulebook    |
| [PROJECT_STATE.md](./docs/PROJECT_STATE.md)             | Current status          |
| [NEXT_TASK.md](./docs/NEXT_TASK.md)                     | Next work item          |

## License

Proprietary — all rights reserved.
