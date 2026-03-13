# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

ContractGuardAI Dashboard — a Next.js (App Router) frontend for AI-powered contract intelligence and portfolio risk monitoring. All data is mock/hardcoded in `data/contracts.ts`; no backend or database is required.

### Running the app

- `npm run dev` starts the dev server on port 3000.
- `npm run build` produces a production build (useful for validating TypeScript and page generation).
- All routes (`/`, `/contracts`, `/contracts/[id]`, `/settings`) serve static mock data.

### Known issues

- **Lint**: `npm run lint` calls `next lint`, which was removed in Next.js 16. ESLint 9 is installed with a legacy `.eslintrc.json` config, causing a circular-structure error. Until the project migrates to an `eslint.config.mjs` flat config, linting via `next lint` or `npx eslint .` will not work.
- **next.config.mjs warning**: `experimental.appDir` is unrecognized in Next.js 16 (it was the default since Next.js 13.4). The warning is harmless.

### Dependencies

- Node.js 22+ and npm 10+ are sufficient.
- No Docker, databases, or external services are needed.
- Supabase client is installed but unused; no env vars are required to run the app.
