# Secure Passage

Secure Passage is a Vite + React + TypeScript application with Supabase-backed edge functions for the AIRLOCK workflow.

## Development

```bash
npm install
npm run dev
```

Common checks:

```bash
npm run lint
npm run test
npm run test:coverage
```

## Testing

The repo now uses a layered test stack:

- Vitest for frontend unit and integration coverage
- Vitest against local Supabase edge functions for backend integration coverage
- Playwright for focused end-to-end flows
- A short manual QA checklist for the few flows that are still awkward to automate

See [docs/testing.md](docs/testing.md) for prerequisites, script behavior, CI expectations, and the manual QA checklist.
