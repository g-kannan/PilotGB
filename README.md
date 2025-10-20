# PilotGB
PilotGB is a lifecycle-aware project management platform for data teams. It combines a PostgreSQL-backed API with a React control tower UI to orchestrate initiatives, safeguard scope of work (SOW) agreements, and surface delivery health.

## Stack
- **Backend**: Node.js (Express), Prisma ORM, PostgreSQL
- **Frontend**: React (Vite), TanStack Query
- **Tooling**: TypeScript across the stack, pnpm workspaces, Vitest

## Getting Started

### 1. Prerequisites
- Node.js 18+
- pnpm 9 (`corepack enable` to install)
- A PostgreSQL database (Neon recommended)

### 2. Install dependencies
```bash
pnpm install
```

### 3. Configure the database connection
```bash
cp apps/api/.env.example apps/api/.env
```
Edit `apps/api/.env` so that `DATABASE_URL` points to your Neon database (e.g. `postgresql://<user>:<password>@<host>/<database>?sslmode=require`). If your Neon project exposes a pooled/unpooled split, set `DIRECT_URL` as well.

> **Optional (local fallback):** You can still use the provided `docker-compose.yml` to run PostgreSQL locally (`docker compose up -d db`) and point `DATABASE_URL` to `postgresql://pilotgb:pilotgb@localhost:5432/pilotgb?schema=public`.

### 4. Apply the Prisma schema
```bash
cd apps/api
pnpm generate
pnpm db:push
cd ../..
```
> The seed script wipes and reloads demo data. Only run `pnpm db:seed` against disposable databases.

### 5. Run the API
```bash
pnpm dev:api
```
The API runs on `http://localhost:4000` and exposes endpoints under `/api`.

### 6. Run the web app
In a new terminal:
```bash
pnpm dev:web
```
Visit `http://localhost:5173` to access the PilotGB control tower.

## Testing
- **Backend**: `cd apps/api && pnpm test` (Vitest unit tests for domain logic)
- **Frontend**: No automated UI tests yet; rely on manual smoke testing (see `/docs/architecture.md` for future coverage ideas).

## Key Workflows
- **Project Onboarding**: Create or archive initiatives from the control tower, set engagement/SOW metadata, and capture project ownership (PM + Data Architect) up front.
- **SOW Governance & Metrics**: Update scope summaries, capture PM/Data Architect approvals, and sign contracts directly from the Scope of Work panel. Data and AI deliverables are quantified with structured metrics before progression is allowed.
- **Stage Gating**: Lifecycle transitions require completed checklists plus explicit approvals from the assigned project manager and data architect. Attempts without those gates return structured 400 errors.
- **Team Onboarding**: Coordinate staffing and access provisioning through the onboarding dashboard. Each assignment tracks onboarding status and system-level access requests with live updates to the backend.

## Data & AI Scope Indicators
- **Data Projects**
  - `# Data Sources`, `# Tables / Entities`, `# Pipelines / Jobs`
  - `# Dashboards / Reports`, `# Models (Data)`
  - `Volume of Data Processed (TB)`
  - `Complexity Score` (`LOW`, `MEDIUM`, `HIGH`)
  - `Data Sensitivity / Compliance Level` (`INTERNAL`, `CONFIDENTIAL`, `REGULATED`)
- **AI / ML Deliverables**
  - `Model Type / Use Case`, `Deployment Status`
  - `Baseline Accuracy / Target Accuracy`
  - `Training Data Volume (TB)`, `# Features`, `Training Iterations`
  - `Model Monitoring KPIs` (drift, latency, accuracy, etc.)

These metrics are editable per initiative and drive the readiness checks enforced by the API when scopes or stages change.

## Useful Scripts
| Command | Description |
| ------- | ----------- |
| `pnpm dev` | Run both API and Web (parallel) |
| `pnpm dev:api` | API only |
| `pnpm dev:web` | Web only |
| `pnpm lint` | Type-check both workspaces |
| `pnpm generate` | Run Prisma client generation |

## Additional Docs
- [`docs/architecture.md`](docs/architecture.md) - high-level architecture, domain model, and local workflow.
