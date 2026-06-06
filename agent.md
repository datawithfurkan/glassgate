# Agent Instructions

This file must be read before starting any task in this repository.

GlassGate is being built by two colleagues working in parallel:

- Frontend owner: responsible for the React/Vite user interface, landing page, dashboard UI, styling, browser behavior, and Vercel frontend deployment configuration.
- Backend owner: responsible for the Express API, crawler, generators, jobs, middleware, tests, runtime configuration, and backend deployment concerns.

Both sides may be active at the same time. The highest-priority rule is: do not delete, overwrite, reset, or "clean up" another person's work.

## Required Start-of-Task Checklist

Before making any change, the agent must:

1. Read this `agent.md` file.
2. Run `git status -sb`.
3. Run `git fetch origin --prune`.
4. Confirm the current branch and upstream with `git branch -vv`.
5. If the local branch is behind its upstream and the worktree is clean, pull the latest changes before editing.
6. Inspect relevant recent commits before changing files owned by the other colleague.
7. Treat all existing local changes as someone else's work unless the agent created them in the current task.

## GitHub Sync Rules

This project changes quickly because frontend and backend work happen in parallel. Agents must keep the repository synchronized with GitHub throughout the task.

- Always fetch before starting work.
- Pull or rebase the current branch before editing when the branch is behind its upstream and the worktree is clean.
- If the task takes a while, fetch again before committing or pushing.
- Before every push, run `git status -sb`, review the staged diff, and fetch again to detect remote changes.
- If the remote moved while the agent was working, integrate the remote changes without overwriting colleague work. Prefer rebasing a small local commit or reapplying a narrow patch on top of the updated branch.
- Push completed commits promptly when the user asks for changes to be published.
- Never force-push unless the user explicitly asks for a force-push and the agent has explained what remote commits would be overwritten.
- After pulling new changes, inspect the recent commit history and the files changed so the agent understands what has moved since the last task.

## Branch and Ownership Rules

- Keep frontend work isolated to frontend-owned files unless the task explicitly requires backend changes.
- Keep backend work isolated to backend-owned files unless the task explicitly requires frontend changes.
- Do not merge, rebase, reset, delete files, rename files, or resolve broad conflicts without understanding which colleague owns the affected work.
- Do not use destructive Git commands such as `git reset --hard`, `git checkout -- <file>`, `git clean`, or force-push unless the user explicitly asks for that exact operation.
- If a task requires touching both frontend and backend, state that clearly and keep the changes small and traceable.
- If a conflict appears between frontend and backend work, preserve both sides where possible and ask the user before discarding anything.

## File Ownership Map

Frontend-owned areas:

- `src/`
- `index.html`
- `vite.config.js`
- `vercel.json`
- frontend-related sections of `package.json` and `package-lock.json`

Backend-owned areas:

- `server/`
- `.env.example`
- backend-related sections of `package.json` and `package-lock.json`
- API, crawler, scoring, generator, middleware, job, search, and health logic

Shared or sensitive areas:

- `README.md`
- `docs/`
- `generated/demo-glasgate/`
- root package scripts and lockfiles
- deployment configuration

Shared files require extra care. Read the surrounding context and recent commits before editing them.

## Collaboration Safety Rules

- Never assume a file is obsolete just because it is unused in the current branch.
- Never delete generated fixtures, docs, config, or duplicate-looking files without confirming why they exist.
- Never revert changes made by another colleague unless the user explicitly asks.
- Prefer additive, narrow changes over broad rewrites.
- Preserve branch intent: production/frontend behavior on `main`, backend work on the backend branch, unless the user gives a different instruction.
- Before pushing, run `git status -sb` and review the diff so only intended files are included.

## Project Story and Work Log

Agents must keep enough project context to understand what both colleagues are building.

- Before starting a new task, read this section and inspect recent commits.
- When making a meaningful change, add a short dated entry to the work log below.
- Keep entries concise: date, branch or workstream, what changed, and why it matters.
- Preserve previous entries. Do not delete or rewrite another colleague's work-log notes unless the user explicitly asks.
- If a change affects both frontend and backend, say that clearly in the entry.

Current workstreams:

- Frontend: React/Vite interface for `glassgate.app`, one-page scrolling landing experience, separate `/audit` dashboard route, Vercel frontend deployment behavior.
- Backend: Express API for audits, crawling, scoring, generated artifacts, jobs, health, metrics, search, optional API key auth, and rate limiting.
- Shared: documentation, generated demo fixture, branch discipline, GitHub synchronization, and deployment coordination.

Work log:

- 2026-06-06, shared docs: Added GitHub sync rules and a project story/work-log section so agents keep up with fast-moving branch changes.
- 2026-06-06, shared docs: Added `agent.md` and `AGENTS.md` so agents read collaboration rules before work starts.
- 2026-06-06, frontend/main: Converted the landing navigation into smooth scrolling sections while keeping `/audit` as a separate route.
- 2026-06-06, frontend/deployment: Restored the Vercel SPA fallback so direct client-side routes like `/audit` resolve to `index.html`.
- 2026-06-06, backend: Hardened the Express API with jobs, health, metrics, search, generated artifacts, optional API key auth, rate limiting, docs, and tests.

## Deployment Awareness

- The frontend is currently deployed from the production branch to Vercel.
- The backend may be deployed separately and should not be assumed to run on Vercel unless configured.
- Changes to `/api` usage, Vercel rewrites, generated artifacts, or environment variables can affect both colleagues and should be reviewed carefully.

## Final Check Before Responding

Before saying a task is complete, the agent must:

1. Check `git status -sb`.
2. Mention whether the worktree is clean or which files changed.
3. Mention any tests or builds that were run.
4. Call out any files intentionally left untouched because they belong to the other side of the project.
