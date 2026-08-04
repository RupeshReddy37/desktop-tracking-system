# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial monorepo structure containing three applications:
  - `tracking-agent` — desktop tracking agent (Java 21 / Spring Boot / SQLite)
  - `tracking-server` — backend server (Java 21 / Spring Boot / PostgreSQL)
  - `tracking-frontend` — frontend dashboard (React / Vite)
- Root repository standards: `README.md`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `.editorconfig`, `.gitattributes`, `.gitignore`.
- Data collection and retention policy (`docs/DATA-COLLECTION-POLICY.md`).
- GitHub automation: CI workflow, Dependabot configuration, issue templates, pull request template, and labels documentation.

---

## Release Notes Guide

Releases are published from the `main` branch using GitHub Releases. Each release follows Semantic Versioning:

- **MAJOR** — incompatible API or behavior changes
- **MINOR** — backward-compatible new functionality
- **PATCH** — backward-compatible bug fixes

### Release Process

1. Move the relevant entries from `[Unreleased]` into a new versioned section (e.g. `## [1.0.0] - YYYY-MM-DD`).
2. Tag the release with the version (e.g. `v1.0.0`).
3. Publish a GitHub Release using the versioned section as the release notes.

### Release Notes Template

```markdown
## What's Changed

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Security
- ...

**Full Changelog**: https://github.com/RupeshReddy37/desktop-tracking-system/compare/v0.1.0...v1.0.0
```
