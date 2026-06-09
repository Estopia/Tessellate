# Contributing to Tessellate

Thanks for helping improve Tessellate.

## Development Setup

Prerequisites:

- Node.js 22+
- pnpm 10+

Install dependencies and start the dev server:

```bash
pnpm install
pnpm dev
```

The Vite dev server binds to `0.0.0.0`, so you can test from phones and tablets on the same local network.

## Project Philosophy

- Keep grid math pure and unit-tested in `src/lib/layout`.
- Keep React components thin, focused, and presentational where possible.
- Prefer moving reusable behavior into hooks, state providers, or pure utilities.
- Preserve the privacy model: Tessellate is fully client-side and images must not be uploaded to a backend.

## Required Checks Before a PR

Run all checks before opening a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

All four commands must pass.

## Code Style

- Use Prettier and ESLint.
- Keep TypeScript strict and explicit where it improves readability.
- Use 2-space indentation.
- Use single quotes.
- Do not use semicolons.

## Commits and Branches

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages, for example:

```text
feat: add masonry layout density control
fix: preserve crop export dimensions
```

Name branches with your username and a short description:

```text
username/short-description
```

## Adding a New Layout Mode

1. Implement the existing `LayoutFn` signature in `src/lib/layout`.
2. Add Vitest tests covering the pure layout behavior.
3. Wire the implementation into the `computeLayout` dispatcher.
4. Add the new option to the settings UI.
5. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.