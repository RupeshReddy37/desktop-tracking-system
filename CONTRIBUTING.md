# Contributing to Desktop Tracking System

Thank you for your interest in contributing. This repository is a monorepo containing three applications that form a single product. Please follow the guidelines below to keep the codebase consistent and reviewable.

## Code of Conduct

Be respectful and constructive. Harassment or abusive behavior is not tolerated. Focus feedback on the code, not the person.

## Repository Structure

This is a monorepo. Changes that span the product (for example, a new event type that must be synced from the agent to the server and shown in the frontend) are expected to touch multiple applications in a single pull request.

| Directory | Application |
|-----------|-------------|
| `tracking-agent/` | Desktop tracking agent (Java / Spring Boot / SQLite) |
| `tracking-server/` | Backend server (Java / Spring Boot / PostgreSQL) |
| `tracking-frontend/` | Frontend dashboard (React / Vite) |

## Getting Started

1. Fork the repository and clone your fork.
2. Create a feature branch (see [Branch Naming](#branch-naming)).
3. Set up the local environment per the [README](README.md#prerequisites).
4. Make your changes.
5. Build and test each affected application independently.
6. Open a pull request against `main`.

## Branch Naming

Use descriptive, prefixed branch names:

- `feature/<short-description>` — new functionality
- `fix/<short-description>` — bug fixes
- `chore/<short-description>` — maintenance, tooling, docs
- `docs/<short-description>` — documentation only

Example: `feature/employee-daily-summary-report`

## Commit Conventions

Write clear, imperative commit messages that describe *what* and *why*:

```
Add daily summary aggregation endpoint

Aggregate raw activity events into per-employee daily summaries
so the dashboard can render usage without scanning raw events.
```

Keep commits focused on a single logical change. Reference related issues where applicable.

## Pull Request Process

1. Ensure your branch is up to date with `main`.
2. Run the build and tests for every application you modified.
3. Update documentation if your change affects configuration, endpoints, or behavior.
4. Open a pull request with a clear title and description of the change and its motivation.
5. A maintainer will review your changes. Address review feedback and keep the discussion focused.

## Build and Test

Each application builds independently:

```bash
# Desktop agent
cd tracking-agent && ./mvnw clean package

# Backend server
cd tracking-server && ./mvnw clean package

# Frontend
cd tracking-frontend && npm install && npm run build
```

Run the relevant tests before submitting a pull request. Do not commit build outputs, logs, databases, or dependency folders (these are ignored by `.gitignore`).

## Data Collection Policy

This product collects work-activity metadata. Any change that alters what data is collected, retained, or exposed must be reviewed against [DATA-COLLECTION-POLICY.md](DATA-COLLECTION-POLICY.md). Do not introduce collection of keystroke content, screenshots, clipboard contents, or browser history.

## Reporting Issues

- **Bugs and feature requests:** open a GitHub issue with a clear description and reproduction steps.
- **Security vulnerabilities:** do **not** open a public issue. Follow [SECURITY.md](SECURITY.md).
