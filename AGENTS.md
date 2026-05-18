# Repository Guidelines

## Project Structure & Module Organization

This is a SvelteKit 2 / Svelte 5 template using TypeScript, Tailwind CSS, shadcn-svelte components, Better Auth, and Drizzle ORM.

- `src/routes/` contains route pages, server load/actions, and route-local styles such as `layout.css`.
- `src/lib/components/` contains reusable app components; `src/lib/components/ui/` is the shadcn-svelte component library.
- `src/lib/server/` contains server-only code, including auth and database modules.
- `src/lib/server/db/schema.ts` defines Drizzle schema exports; generated auth tables live in `auth.schema.ts`.
- `static/` stores public assets served as-is.
- `drizzle/` stores generated database migrations.

## Build, Test, and Development Commands

Use Bun for dependency and script execution because this repository includes `bun.lock`.

- `bun install` installs dependencies.
- `bun run dev` starts the Vite development server.
- `bun run build` creates a production build.
- `bun run preview` serves the production build locally.
- `bun run check` runs SvelteKit sync and TypeScript/Svelte diagnostics.
- `bun run lint` runs ESLint across the repository.
- `bun run db:generate` and `bun run db:migrate` manage Drizzle database changes.
- `bun run auth:schema` regenerates Better Auth schema output.

## Coding Style & Naming Conventions

Write TypeScript and Svelte using ES modules. Match the existing style: two-space indentation in Svelte markup, double quotes in TypeScript imports, and trailing commas where multiline objects already use them.

Use kebab-case for Svelte component files such as `login-form.svelte` and `sidebar-menu-button.svelte`. Keep route files aligned with SvelteKit conventions: `+page.svelte`, `+page.server.ts`, and `+layout.svelte`. Prefer `$lib/...` imports for shared modules.

Run `bun run lint` and `bun run check` before submitting changes.

## Testing Guidelines

No dedicated test runner is configured yet. Treat `bun run check` and `bun run lint` as the required verification steps for every change. For behavior-heavy additions, add focused tests only after introducing an appropriate test framework and script in `package.json`.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit style, for example `feat(svelte): Add auth schemas` and `feat: Add host config to vite`. Keep commits concise and scoped: `fix(auth): handle invalid login` or `feat(db): add task status`.

Pull requests should include a short summary, verification commands run, related issue links when available, and screenshots for visible UI changes. Note any schema, migration, environment, or auth changes explicitly.

## Security & Configuration

Copy `.env.example` to `.env` for local setup. Do not commit secrets or production database credentials. Drizzle requires `DATABASE_URL`; Turso auth may also require `DATABASE_AUTH_TOKEN`.
