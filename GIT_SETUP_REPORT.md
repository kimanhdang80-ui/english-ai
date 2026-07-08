# GIT_SETUP_REPORT.md — English AI

> Role: Senior DevOps Engineer. Task: git setup + first commit + push to GitHub. Date: 2026-07-03.
> **Outcome: commit ✅ and push ✅ — the repo is live on GitHub (`main` @ `eeecd1f`).**

---

## Summary

| Item            | Result                                                                                 |
| --------------- | -------------------------------------------------------------------------------------- |
| **Remote**      | ✅ `origin` → `https://github.com/kimanhdang80-ui/english-ai.git` (already configured) |
| **Branch**      | ✅ `main` (tracking `origin/main`)                                                     |
| **Commit Hash** | ✅ `eeecd1f0da2ced2720ad16c1d377b5b9774bb70f` (short `eeecd1f`)                        |
| **Push Result** | ✅ **Success** — `* [new branch] main -> main`; verified `ls-remote` = `eeecd1f`       |
| **GitHub URL**  | https://github.com/kimanhdang80-ui/english-ai                                          |

---

## 1. Initial state (git status / remote / branch)

`english-ai/` was **already a git repo**, on branch **`main`**, **no commits yet**, all files staged.
`origin` was **already set correctly** — no `git remote add` needed:

```
origin  https://github.com/kimanhdang80-ui/english-ai.git (fetch)
origin  https://github.com/kimanhdang80-ui/english-ai.git (push)
```

- Staged **440 files**; verified **no** `.env`/secrets, `node_modules/`, `.next/`, or `coverage/`
  were staged (`.gitignore` covers them). Git identity present: `kimanhdang80-ui`.

## 2. Husky / lint-staged / ESLint / Prettier

- **Husky v9** active (`core.hooksPath` = `.husky/_`; `.husky/pre-commit` → `npx lint-staged`).
- **lint-staged** present; runs `eslint --fix` + `prettier --write` on staged code, `prettier --write`
  on staged `json/md/css`. **ESLint** (`eslint-config-next` + `@typescript-eslint`) + **Prettier** ok.

## 3. Pre-commit gates

- `npm run lint` → ✅ no warnings/errors · `npm run typecheck` → ✅ clean · `npm run build` → ✅
  compiled (exit 0; only a non-blocking Prisma 6→7 `package.json#prisma` deprecation).

## 4. Commit — failed once, root-caused, fixed properly, then succeeded

**First `git commit` FAILED** inside the husky `pre-commit` hook (the hook worked as intended — it was
**not** bypassed):

```
✖ eslint --fix:
  tailwind.config.ts
    85:13  error  A `require()` style import is forbidden  @typescript-eslint/no-require-imports
husky - pre-commit script failed (code 1)
```

**Root cause:** `tailwind.config.ts` used `plugins: [require('tailwindcss-animate')]`. It passed
`npm run lint` because **`next lint` skips root config files** (it lints `app/`, `src/`, …), but
lint-staged runs `eslint` **directly on the staged file**, which flags the `require()`.

**Fix (standard, no `--no-verify`, no Husky disable, no eslint-disable):** converted the CommonJS
`require()` to an ESM import matching the file's existing `import`/`export default` style:

```ts
import tailwindcssAnimate from 'tailwindcss-animate';
// ...
plugins: [tailwindcssAnimate],
```

Verified `npx eslint tailwind.config.ts` → exit 0 and `npm run build` → ✅ (Tailwind plugin still
loads). **Second `git commit` SUCCEEDED**: `eeecd1f` — _"Initial commit - English AI Beta"_ —
**440 files, 48,258 insertions**, author `kimanhdang80-ui <kimanhdang80@gmail.com>`.

## 5. Push — succeeded via device-code flow in Chrome

The first `git push` (default GCM browser flow) **hung** because the machine's **default browser is
Internet Explorer** (`IE.HTTP`), and GitHub OAuth doesn't complete there; it was killed by the
2-minute timeout (this was reported, not retried blindly).

Resolved with the **OAuth device-code flow** so any browser (Chrome) works, independent of the
default-browser setting:

- Ran `git push` with `GCM_GITHUB_AUTHMODES=device` (background, so it stays alive during auth).
- Git Credential Manager (v2.7.3) showed the one-time code; **Chrome** was opened to
  `https://github.com/login/device`; the user entered the code and **authorized** the GitHub account.
- GCM captured the token and the push completed:

```
To https://github.com/kimanhdang80-ui/english-ai.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

**Verified:** `git ls-remote --heads origin` →
`eeecd1f0da2ced2720ad16c1d377b5b9774bb70f refs/heads/main`. The commit is on GitHub; the token is now
cached by GCM for future pushes.

## 6. Những việc còn thiếu (remaining / follow-ups)

- **`tsconfig.tsbuildinfo` was committed** — a generated TypeScript build cache that should be
  ignored. Recommended small follow-up commit:
  ```bash
  echo "tsconfig.tsbuildinfo" >> .gitignore
  git rm --cached tsconfig.tsbuildinfo
  git commit -m "chore: ignore tsconfig.tsbuildinfo build cache" && git push
  ```
- **`GIT_SETUP_REPORT.md` (this file) is untracked** — not part of `eeecd1f`. Commit it if you want it
  in the repo.
- **Default browser is IE** — consider setting Chrome as the Windows default so future GCM/OAuth
  prompts open in Chrome automatically (the token is cached now, so routine pushes won't re-prompt).
- **Branch protection / CI** — enable branch protection on `main` and the included
  `.github/workflows/ci.yml` + `pull_request_template.md` once collaborators join.
- **Next step:** import the repo into Vercel and follow `DEPLOY_CHECKLIST.md` / `VERCEL_DEPLOY.md`
  (Supabase env + `npm run db:release`).

---

## Verdict

**Done and verified.** Repo, remote, husky hooks, first commit (`eeecd1f`, gates green, hook passing
after a proper fix), and the **push to GitHub are all complete** — `main` is live at
https://github.com/kimanhdang80-ui/english-ai. The push succeeded through the device-code flow in
Chrome, sidestepping the IE-default-browser problem; GCM has cached the token for subsequent pushes.
