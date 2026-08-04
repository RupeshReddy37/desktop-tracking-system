# Desktop Tracking System

A desktop employee activity tracking system composed of three applications that work together as a single product:

| Application | Directory | Stack | Role |
|-------------|-----------|-------|------|
| **Desktop Tracking Agent** | `tracking-agent/` | Java 21, Spring Boot, SQLite, JNA | Runs on employee workstations; collects activity/window/system metadata locally and syncs it to the server |
| **Backend Server** | `tracking-server/` | Java 21, Spring Boot, PostgreSQL, Liquibase, Swagger | Central API that ingests agent syncs, stores data, and serves dashboards and reports |
| **Frontend Application** | `tracking-frontend/` | React 18, Vite | Web dashboard for viewing live status, consolidated reports, and anomaly review |

This repository is a **monorepo**: all three applications are versioned, released, and maintained together because they form one product with a shared domain model and a coordinated release cycle.

---

## Architecture Overview

```
┌─────────────────────┐        ┌──────────────────────┐        ┌─────────────────────┐
│  Desktop Agent      │  sync  │  Backend Server      │  REST  │  Frontend           │
│  (tracking-agent)   │ ─────► │  (tracking-server)   │ ◄────► │  (tracking-frontend)│
│  SQLite local store │        │  PostgreSQL store     │        │  React dashboard    │
└─────────────────────┘        └──────────────────────┘        └─────────────────────┘
```

- The **agent** runs on each employee workstation, records activity metadata into a local SQLite database, and periodically syncs batches to the server.
- The **server** validates and stores synced events, aggregates daily reports, and exposes REST endpoints for the dashboard and reports.
- The **frontend** consumes the server API to render live status, daily summaries, application usage, and anomaly review.

> **Data collection policy:** This system collects work-activity *metadata* only. It does **not** capture keystroke content, screenshots, clipboard contents, or browser history. See [docs/DATA-COLLECTION-POLICY.md](docs/DATA-COLLECTION-POLICY.md) for the full policy.


---

## Repository Layout

```
/
├── tracking-agent/          # Desktop tracking agent (Java / Spring Boot / SQLite)
├── tracking-server/         # Backend server (Java / Spring Boot / PostgreSQL)
├── tracking-frontend/       # Frontend dashboard (React / Vite)
├── docs/
│   └── DATA-COLLECTION-POLICY.md
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
├── .editorconfig
├── .gitattributes
└── .gitignore

```

---

## Prerequisites

- **Java 21** (JDK) for `tracking-agent` and `tracking-server`
- **Node.js 18+** and **npm** for `tracking-frontend`
- **PostgreSQL** for the backend server (default connection: `jdbc:postgresql://localhost:5432/tracking_server`)

---

## Building and Running

Each application builds independently. See the per-application READMEs for details.

### Desktop Agent (`tracking-agent/`)

```bash
cd tracking-agent
./mvnw clean package -DskipTests
java -jar target/tracking-agent-0.0.1-SNAPSHOT.jar
```

Configuration is externalized via environment variables (see `tracking-agent/src/main/resources/application.yaml`). A Windows service wrapper is provided under `tracking-agent/windows-service/`.

### Backend Server (`tracking-server/`)

```bash
cd tracking-server
./mvnw clean package -DskipTests
java -jar target/tracking-server-0.0.1-SNAPSHOT.jar
```

The server listens on port `8081` by default. Swagger UI is available at `/swagger-ui.html`. Database credentials are externalized via `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` environment variables.

### Frontend Application (`tracking-frontend/`)

```bash
cd tracking-frontend
npm install
npm run dev        # development server on http://localhost:5173
npm run build      # production build to dist/
```

During development, the Vite dev server proxies `/api` requests to `http://localhost:8081`.

---

## Configuration

All configuration is externalized through environment variables with sensible development defaults. See each application's `application.yaml` for the full set of options.

| Variable | App | Default | Purpose |
|----------|-----|---------|---------|
| `TRACKING_SERVER_URL` | agent | `http://localhost:8081` | Server URL the agent syncs to |
| `TRACKING_EMPLOYEE_CODE` | agent | *(empty)* | Employee code for the agent |
| `DB_URL` | server | `jdbc:postgresql://localhost:5432/tracking_server` | PostgreSQL JDBC URL |
| `DB_USERNAME` | server | `tracking_admin` | Database username |
| `DB_PASSWORD` | server | *(dev default)* | Database password — **override in production** |
| `SERVER_PORT` | server | `8081` | HTTP port |
| `VITE_API_BASE_URL` | frontend | *(empty → Vite proxy)* | Backend base URL |

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute, including branch naming, commit conventions, and the pull request process.

## Security

To report a security vulnerability, please follow the process described in [SECURITY.md](SECURITY.md). Do **not** open a public issue for security problems.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
