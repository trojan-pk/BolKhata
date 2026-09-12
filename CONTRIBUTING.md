# Contributing to BolKhata

Thanks for your interest in contributing to BolKhata! We welcome bug reports,
feature ideas, documentation improvements, and code contributions.

## Before You Start

- Read the [Code of Conduct](./CODE_OF_CONDUCT.md)
- Search existing issues and pull requests before opening a new one
- Keep changes focused and scoped to a single purpose

## Development Setup

This repository is a monorepo with `frontend/` (Expo app) and `backend/`
(Express API).

### Prerequisites

- Node.js LTS (recommended)
- npm
- Expo CLI via `npx expo ...`

### Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Run Locally

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npx expo start
```

## Contribution Workflow

1. Fork the repository and create a branch from `main`
2. Make your changes in small, clear commits
3. Update related docs when behavior changes
4. Run relevant checks before opening a PR
5. Open a pull request with a clear summary and testing notes

## Validation Checklist

Run what applies to your change:

```bash
cd frontend && npm run type-check
cd backend && npm run build
```

If you touched runtime behavior, include manual verification steps in your PR.

## Pull Request Guidelines

- Use a descriptive title
- Explain **what** changed and **why**
- Include screenshots or recordings for UI updates when helpful
- Mention any follow-up work or known limitations

## Reporting Issues

When filing an issue, include:

- Expected behavior
- Actual behavior
- Reproduction steps
- Relevant logs, screenshots, or environment details

Thanks for helping improve BolKhata.
