# Testing Guide

This repository uses a repeatable local test pyramid that matches CI as closely as possible.

## Prerequisites

- Node.js 20+
- npm
- Docker running locally
- Supabase CLI available on your `PATH`
- Playwright browser binaries installed locally when running E2E tests:

```bash
npx playwright install chromium
```

## Test Layers

- `npm run test`
  Runs the fast frontend Vitest suite. This is the default local check.
- `npm run test:unit`
  Explicit alias for the frontend Vitest suite.
- `npm run test:coverage`
  Runs the frontend Vitest suite with coverage enabled and enforces the 80% statements, branches, functions, and lines thresholds on app-owned code.
- `npm run test:functions`
  Starts local Supabase if needed, resets the local database, serves edge functions, and runs the backend Vitest integration suite.
- `npm run test:e2e`
  Starts local Supabase if needed, resets the local database, serves edge functions, starts the Vite app on `http://127.0.0.1:8080`, and runs Playwright against Chromium desktop plus mobile Chromium emulation.
- `npm run test:full`
  Runs the intended pre-merge stack in order: lint, frontend coverage, edge-function integration tests, then Playwright.

## Local Workflow

Fast feedback:

```bash
npm run lint
npm run test
```

Pre-merge verification:

```bash
npm run test:full
```

Targeted backend or browser verification:

```bash
npm run test:functions
npm run test:e2e
```

## Notes On Local Supabase

- The function and E2E scripts automatically reset local state before running.
- The orchestration scripts expect the Supabase CLI to be installed and Docker to be available.
- The Playwright config targets the local app on port `8080` and uses deterministic demo seeding helpers instead of remote environments.

## CI

The GitHub Actions workflow at `.github/workflows/test.yml` runs:

- `npm ci`
- `npm run lint`
- `npm run test:coverage`
- `npm run test:functions`
- `npm run test:e2e`

That job also installs the Supabase CLI and the Chromium Playwright browser so local and CI execution paths stay aligned.

## Manual QA Checklist

Keep this short and focused on flows that still have lower automation ROI:

- Verify the password reset email handoff end-to-end from the delivered link in a real mailbox.
- Smoke test the authenticated dashboard and review flows in Safari and Firefox.
- Run a keyboard-only pass across login, review approve, review deny, and drawer close interactions.
- Check the not-found route and recovery links in a real browser session.
- Confirm the mobile layout still feels usable on the main authenticated flows after any larger UI change.
