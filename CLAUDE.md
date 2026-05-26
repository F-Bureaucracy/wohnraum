# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product

Web app for the public administration of the city of Osnabrück. The goal is to provide a platform for assigning homeless people to available apartments:

- **Landlords (Vermieter)** log in and list their homes (Mietobjekte) as available for rent.
- **Case workers** (administration staff) see those listings together with a roster of homeless people (Mieter) and assign tenants to apartments.

The three primary actor types (landlord org, administration org, tenant) map onto the Better Auth `organization` plugin's `orgType` field — see the auth section below.

## Stack

SvelteKit 2 + Svelte 5, TypeScript, Tailwind CSS v4, shadcn-svelte (`src/lib/components/ui/`), Better Auth (with `organization` + `audit-logs` plugins), Drizzle ORM against **Postgres** (`postgres-js`). Package manager is **Bun** (`bun.lock` present); do not use npm/pnpm.

Note: the README is a stale `sv`-template stub that mentions npm and SQLite/Turso — ignore it. Postgres is the actual database (see `src/lib/server/db/index.ts` and `drizzle.config.ts`).

## Commands

- `bun run dev` — Vite dev server
- `bun run build` / `bun run preview`
- `bun run check` — `svelte-kit sync` + `svelte-check` (TS/Svelte diagnostics)
- `bun run lint` — ESLint
- `bun run db:generate` / `bun run db:migrate` / `bun run db:push` / `bun run db:studio`: Do not use these commands. The user will push the changes themself.
- `bun run auth:schema` — regenerate `src/lib/server/db/auth.schema.ts` from `src/lib/server/auth.ts` config

No test runner is configured. Treat `bun run check` and `bun run lint` as the required verification before submitting changes.

## Architecture

**Auth flow.** `src/hooks.server.ts` calls `auth.api.getSession()` on every request and populates `event.locals.session` / `event.locals.user`, then delegates to `svelteKitHandler` from `better-auth/svelte-kit`. Route guards rely on `locals.user`; e.g. `src/routes/(app)/+layout.server.ts` exposes the user to the `(app)` route group.

**Better Auth config (`src/lib/server/auth.ts`).** Uses `betterAuth/minimal` + `drizzleAdapter` (pg). The `organization` plugin has teams enabled and adds a required `orgType` field; a `beforeCreateOrganization` hook restricts `orgType === "administration"` to users with `role === "super_admin"`. `sveltekitCookies(getRequestEvent)` must remain the last plugin. Password reset goes through `$lib/server/email`.

**Database schema.** `src/lib/server/db/schema.ts` is the entry point and re-exports `./auth.schema` (generated — do not hand-edit; regenerate via `bun run auth:schema` after changing the Better Auth config). Add app tables to `schema.ts`, then `bun run db:generate` + `db:migrate`.

**Route layout.** Authenticated app lives under `src/routes/(app)/` (Mietobjekte, Mieter, Vermieter, Dokumente). Auth-related routes (`login`, `signup`, `auth`, `password-reset`, `settings`) live at the top level of `src/routes/`. UI is German-language domain terminology.

**Imports.** Use `$lib/...` for shared modules; server-only code must live under `src/lib/server/` so SvelteKit's import boundary enforces it.

## Conventions

- Kebab-case for Svelte component filenames (`login-form.svelte`).
- Two-space indent, double quotes in TS imports, trailing commas in existing multiline objects.
- Conventional Commits (`feat:`, `fix:`, optional scope like `feat(auth):`).
- Environment: `DATABASE_URL` is required; `BETTER_AUTH_SECRET` and `ORIGIN` are used by auth. Copy `.env.example` to `.env`.
