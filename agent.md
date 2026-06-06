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
3. Run `git fetch origin --prune` when the task involves current GitHub state, pushing, pulling, deployment, branches, or collaboration.
4. Confirm the current branch and upstream with `git branch -vv`.
5. Inspect relevant recent commits before changing files owned by the other colleague.
6. Treat all existing local changes as someone else's work unless the agent created them in the current task.

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
