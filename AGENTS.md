<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# cr0ss.org

Personal site: a Contentful-backed blog/portfolio and a Neon-backed quantified-self dashboard. Next.js 16 App Router with Cache Components, React 19, TypeScript, Tailwind 4, shadcn/ui. Read [README.md](README.md) for the stack, layout, caching model and API table — this file only adds what an agent needs on top of it.

## Commands

```bash
pnpm dev
pnpm tsc --noEmit        # type-check (CI runs this; there is no script for it)
pnpm lint
pnpm format              # Prettier check; pnpm format:fix to write
pnpm test                # Vitest; pnpm test:changed for only affected tests
pnpm build && pnpm e2e   # Playwright smoke tests need a production build
pnpm db:migrate status   # status | up | baseline
```

Before calling a change done: type-check, lint, format and the relevant tests. Build when routing, caching or config changed.

## Conventions

- **Caching.** Data reads are `'use cache'` functions with a `cacheLife` profile from `next.config.mjs` and tags from `lib/cache/tags.ts`. A new tag goes in that registry; a write endpoint must call the matching `revalidateX()` from `lib/cache/revalidate.ts`. Don't add a `runtime` export (Cache Components rejects it, including `'edge'`) or the old `revalidate`/`dynamic` segment configs — use `'use cache'` instead.
- **API routes** use `createApiRoute()` from `lib/api/middleware.ts` (`.withAuth().withRateLimit().withTrace().handle()`) and the helpers in `lib/api/responses.ts`. Check auth before parsing the body. Errors are `{ error, details?, code? }`; never return raw error messages or stacks to the client.
- **Auth** is a shared-secret header checked by `lib/auth/secret.ts`: `x-admin-secret` for dashboard routes, `x-vercel-revalidation-key` for the Contentful webhook.
- **Validation.** Zod at every boundary (request bodies, query params, webhook payloads, DB rows). Define the schema and derive the type with `z.infer`; don't write the type separately.
- **Environment.** Import `env` from `@/env` instead of reading `process.env`; new variables are declared there.
- **Database.** `sql` from `lib/db/client.ts` (Neon serverless) with tagged-template parameters only — never build SQL by string concatenation. Schema changes are a new numbered file in `db/migrations/`; never edit one that has been applied.
- **Rendering content.** Contentful rich text goes through the rich-text renderer. `dangerouslySetInnerHTML` is only for `JSON.stringify`'d JSON-LD.
- **Time.** Dashboard days are Europe/Berlin; use the helpers in `lib/time/`.
- **Code style.** `@/` imports, `import type` for type-only imports, no `any`. Tests sit next to the code as `*.test.ts(x)`. Comments explain why, not what.
- **Commits.** Imperative, sentence-case subject describing the behaviour change (e.g. "Redirect www.cr0ss.org to the apex domain"); no conventional-commit prefixes.

## More docs

- `docs/REVALIDATION.md` — webhook payloads and what each invalidates
- `docs/api/openapi.yaml` — dashboard API reference
- `docs/dashboard-data-dependencies.md`, `docs/PRD-correlation-engine.md`
