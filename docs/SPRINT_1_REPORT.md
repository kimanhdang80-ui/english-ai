# SPRINT 1 REPORT — English AI (Foundation)

- **Sprint:** 1 — Repo, Tooling & Foundation
- **Date:** 2026-07-01
- **Status:** ✅ Complete — build, typecheck, lint, and format all green
- **Scope rule honored:** no English-learning features built; foundation only.

---

## 1. What was created

### Application scaffold

- **Next.js 15 (App Router) + React 19 + TypeScript (strict)** project.
- **Root layout** with Inter font, metadata, and theme provider.
- **Three placeholder screens (no business logic):**
  - `/` — minimal landing page (hero, header, footer, theme toggle).
  - `/login` — login **placeholder** (visual form, disabled, no auth logic).
  - `/dashboard` — dashboard **placeholder** (skill cards, "coming soon").
- **`/api/health`** route handler for Docker/Railway health checks + CI smoke.

### Theme & design system

- Semantic **color tokens** (HSL CSS variables) implementing UI_GUIDELINE §2 — brand
  Indigo primary, Teal secondary, Amber accent, success/destructive, neutrals.
- **Dark Mode** via `next-themes` (light / dark / system) with a `ThemeToggle`.
- **shadcn/ui** setup (`components.json`) + primitives: `Button` (with `asChild`), `Input`.
- `cn()` utility (clsx + tailwind-merge).

### Data layer

- **Initial Prisma schema** (`prisma/schema.prisma`) — Identity & Content core:
  `User`, `UserProfile`, `AuthAccount`, `Language`, `CefrLevel`, `Skill`, `Course`,
  `CourseUnit`, `Lesson` + enums, `snake_case` table maps, indexes, UUID PKs.
- **Prisma client singleton** (`src/lib/prisma.ts`).

### Auth scaffolding (no logic)

- Supabase **browser** and **server** clients via `@supabase/ssr`
  (`src/lib/supabase/*`). Wiring only — authentication is Sprint 3.

### Configuration & tooling

- **TypeScript** strict config with `@/*` alias, `noUncheckedIndexedAccess`.
- **ESLint** (`next/core-web-vitals` + `next/typescript` + prettier), **Prettier**
  (+ tailwind plugin), `.editorconfig`, `.nvmrc`.
- **Husky** pre-commit → **lint-staged** (eslint --fix + prettier on staged files).
- **Env:** `.env.example` + fail-fast `src/lib/env.ts` accessor.

### Infrastructure & delivery

- **Dockerfile** — multi-stage, Next.js `standalone` output, non-root runtime user.
- **docker-compose.yml** — PostgreSQL 16 + Redis 7 (+ optional app profile).
- **GitHub Actions CI** — install → prisma generate → lint → typecheck → format:check → build.
- **Railway** (`railway.json`, Dockerfile build, `/api/health` probe) and
  **Vercel** (`vercel.json`) deploy configs.
- Repo hygiene: `.gitignore`, `.dockerignore`, `CODEOWNERS`, PR template; git initialized on `main`.

### Documentation

- **README.md** (install / run / build / deploy / structure).
- **ADR-0001** — Next.js full-stack + Supabase Auth decision.
- Updated **PROJECT_STATE.md**, **CHANGELOG.md**, **NEXT_TASK.md** (→ Sprint 2).

---

## 2. Architecture

Per **[ADR-0001](./adr/ADR-0001.md)**, the MVP is a **single
Next.js full-stack application** with **Supabase Auth**, deploying to **Vercel**
(web) and **Railway** (container). This supersedes the original NestJS monorepo in
SYSTEM_ARCHITECTURE.md for the MVP, while preserving its clean-architecture
principles:

- **Layered, framework-light domain** — logic lives in `src/lib` (and future
  `src/modules`), not in components or route handlers.
- **Provider abstraction** — Supabase (auth), Prisma (data), and later AI/storage are
  accessed through dedicated modules, never vendor SDKs sprinkled through the UI.
- **Reversible** — the "extraction trigger" rule still holds: heavy/independent
  workloads (AI workers, media/TTS, realtime) become separate services later.

```
Browser ──▶ Next.js (App Router: Server Components · Route Handlers · Server Actions)
                 │                         │
                 ▼                         ▼
          Supabase Auth            Prisma ──▶ PostgreSQL
          (scaffolded)                        (Supabase in prod)
```

---

## 3. Folder structure

```
english-ai/
├── docs/                       # documentation (source of truth) + adr/, SPRINT_1_REPORT.md
├── prisma/
│   └── schema.prisma           # initial identity + content schema
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/dashboard/page.tsx
│   │   ├── api/health/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css         # theme tokens + dark mode
│   ├── components/
│   │   ├── ui/{button,input}.tsx
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── config/site.ts
│   └── lib/
│       ├── utils.ts · env.ts · prisma.ts
│       └── supabase/{client,server}.ts
├── .github/{workflows/ci.yml, pull_request_template.md}
├── .husky/pre-commit
├── Dockerfile · .dockerignore · docker-compose.yml
├── railway.json · vercel.json
├── package.json · tsconfig.json · tailwind.config.ts · postcss.config.mjs
├── next.config.mjs · components.json
├── .eslintrc.json · .prettierrc.json · .editorconfig · .nvmrc · .env.example
└── README.md
```

---

## 4. Packages installed

**Runtime**

| Package                                        | Version     | Purpose                 |
| ---------------------------------------------- | ----------- | ----------------------- |
| next                                           | 15.5.x      | Framework (App Router)  |
| react / react-dom                              | 19.x        | UI runtime              |
| @prisma/client                                 | 6.x         | DB client               |
| @supabase/ssr, @supabase/supabase-js           | 0.5.x / 2.x | Auth clients (scaffold) |
| next-themes                                    | 0.4.x       | Dark mode               |
| tailwind-merge, clsx, class-variance-authority | —           | Styling utilities       |
| @radix-ui/react-slot                           | 1.x         | `asChild` composition   |
| lucide-react                                   | 0.4xx       | Icons                   |
| tailwindcss-animate                            | 1.x         | Animations              |

**Dev**

| Package                                            | Version            | Purpose               |
| -------------------------------------------------- | ------------------ | --------------------- |
| typescript                                         | 5.7.x              | Type system           |
| prisma                                             | 6.x                | Migrations / generate |
| tailwindcss, postcss, autoprefixer                 | 3.4.x / 8.x / 10.x | Styling toolchain     |
| eslint, eslint-config-next, eslint-config-prettier | 8.x / 15.x / 9.x   | Linting               |
| prettier, prettier-plugin-tailwindcss              | 3.x / 0.6.x        | Formatting            |
| husky, lint-staged                                 | 9.x / 15.x         | Git hooks             |
| @types/node, @types/react, @types/react-dom        | —                  | Types                 |

> Package manager: **npm** (pnpm is not available in the current environment; the
> lockfile is `package-lock.json`). Scripts and CI use npm accordingly.

---

## 5. Verification results

| Check            | Command                   | Result                         |
| ---------------- | ------------------------- | ------------------------------ |
| Type safety      | `npm run typecheck`       | ✅ 0 errors                    |
| Lint             | `npm run lint`            | ✅ 0 errors/warnings           |
| Format           | `npm run format:check`    | ✅ clean                       |
| Prisma client    | `npm run prisma:generate` | ✅ generated                   |
| Production build | `npm run build`           | ✅ 6 routes, standalone output |

Build routes: `/`, `/_not-found`, `/api/health` (dynamic), `/dashboard`, `/login`.

---

## 6. Deviations from the original Sprint 1 plan

The original [NEXT_TASK.md](./NEXT_TASK.md) described a **pnpm/Turborepo monorepo with
NestJS**. Sprint 1.1 redirected the stack to **Next.js full-stack + Supabase +
Vercel/Railway**, so:

- Built a **single Next.js app** (not `apps/*` + `packages/*` monorepo) — see ADR-0001.
- Used **npm** (pnpm unavailable in the environment).
- **Vitest/Playwright test harness deferred to Sprint 2** (no application logic exists
  to test yet; CI currently gates lint/type/format/build).
- An initial **Prisma schema was included now** (requested by Sprint 1.1), though
  migrations/seed remain Sprint 2.

---

## 7. Remaining work for Sprint 2

See [NEXT_TASK.md](./NEXT_TASK.md) for the full spec. Summary:

1. Provision PostgreSQL (Docker/Supabase) and wire `DATABASE_URL`/`DIRECT_URL`.
2. Expand the Prisma schema (roles/permissions, `lesson_activities`, vocabulary core).
3. Generate + commit the **initial migration**; verify on a clean DB.
4. **Seed** reference data (languages, CEFR levels, skills, sample course).
5. Build the **repository/data-access layer**.
6. Add **Vitest**; add Postgres service to CI; run `migrate deploy` + tests there.
7. Update docs (PROJECT_STATE, CHANGELOG, NEXT_TASK → Sprint 3).

**Then Sprint 3 — Auth & Identity** (Supabase Auth: sessions, middleware refresh,
route guards, RBAC).
