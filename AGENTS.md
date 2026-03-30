# Repository Guidelines

## Project Structure & Module Organization
This repository is a Vite + React + TypeScript frontend with Supabase backend pieces.

- `src/main.tsx` and `src/App.tsx` are the application entry points.
- `src/pages/` holds route-level views (for example: `Dashboard.tsx`, `Login.tsx`, `Demo.tsx`).
- `src/components/` contains reusable UI; grouped into folders like `ui/`, `crossings/`, `receipts/`, `status/`, and `shell/`.
- `src/hooks/` contains shared behavior such as auth, theme, and realtime hooks.
- `src/lib/`, `src/types/`, and `src/integrations/` hold utilities, typed models, and external integrations.
- `src/test/` contains Vitest setup and test files.
- `public/` stores static assets.
- `supabase/functions/` contains edge functions and `supabase/migrations/` contains database migrations.

## Build, Test, and Development Commands
- `npm install` - install dependencies.
- `npm run dev` - start local dev server.
- `npm run build` - production build.
- `npm run build:dev` - development-mode build.
- `npm run preview` - preview production build locally.
- `npm run lint` - run ESLint (`eslint.config.js`).
- `npm run test` - run Vitest once.
- `npm run test:watch` - run Vitest in watch mode.

Common local flow:
```bash
npm install
npm run dev
npm run lint
npm run test
```

## Coding Style & Naming Conventions
- TypeScript is used across the app; prefer typed props, clear interfaces, and minimal `any`.
- Use 2-space indentation and React functional components.
- Component files use `PascalCase` (`CrossingCard.tsx`), hooks use `useXxx` (`useAuth.tsx`), and helpers use camelCase.
- Use module aliases (`@/...`) for imports when possible.
- Keep files small and co-located with their related tests/styles.
- Run ESLint before PRs to catch obvious style and React hook rule issues.

## Testing Guidelines
- Vitest is configured in `vitest.config.ts` with `jsdom` and `src/test/setup.ts`.
- Test discovery pattern: `src/**/*.{test,spec}.{ts,tsx}`.
- Prefer behavior-driven test names (e.g. `crossing-card.test.tsx`) and keep assertions user-facing.

## Commit & Pull Request Guidelines
Recent commits are short, imperative summaries (`Add keyboard shortcuts...`, `Theme detects system only`).

- Keep commit subjects short and imperative.
- Keep PRs scoped to a single change area.
- PR description should include: summary, test output (`npm run lint`, `npm run test`), and screenshots for UI changes.

## Security & Configuration Tips
- Keep environment values in `.env` (`VITE_SUPABASE_*`) and avoid hard-coding credentials.
- Never commit service keys that should remain private.
- For local data-layer changes, update `supabase/migrations/` and the relevant function in `supabase/functions/` together.
