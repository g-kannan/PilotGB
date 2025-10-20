# Local Development Guide

This guide expands on the README quick start with more detail about running PilotGB locally, populating data, and validating behaviour.

## 1. Bootstrap Tooling
1. Install Node.js 18 or newer.
2. Enable pnpm via Corepack:
   ```bash
   corepack enable
   corepack prepare pnpm@9.0.0 --activate
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```

## 2. Configure PostgreSQL (Neon recommended)
1. Create a database in [Neon](https://neon.tech/) (or any managed PostgreSQL provider). Copy the connection string (usually ends with `?sslmode=require`).
2. Copy the environment template and paste the connection string:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   Update `DATABASE_URL` (and `DIRECT_URL` if needed) inside `apps/api/.env`.

> **Local fallback:** if you prefer running PostgreSQL yourself, `docker-compose.yml` still spins up a compatible instance. Start it with `docker compose up -d db` and point `DATABASE_URL` to `postgresql://pilotgb:pilotgb@localhost:5432/pilotgb?schema=public`.

## 3. Sync Prisma with the database
```bash
cd apps/api
pnpm generate     # prisma generate
pnpm db:push      # sync schema to your database
cd ../..
```
> The optional seed (`pnpm db:seed`) wipes and reloads demo data. Only run it on disposable environments.

## 4. Run Services
Start the backend (Express API):
```bash
pnpm dev:api
```
This serves on `http://localhost:4000`.

In a second terminal start the frontend:
```bash
pnpm dev:web
```
Vite binds to `http://localhost:5173` and proxies `/api` requests to the backend.

## 5. Validate the Environment
Optional ad-hoc checks:
- API health: `curl http://localhost:4000/health`
- List initiatives: `curl http://localhost:4000/api/initiatives`
- Load the UI in the browser; confirm lifecycle board and metrics render seeded data.

## 6. Run Tests
- Backend unit tests:
  ```bash
  cd apps/api
  pnpm test
  ```
- Frontend currently relies on manual testing; consider adding Vitest + React Testing Library in future phases.

## 7. Common Ops
- Regenerate Prisma client after schema changes: `pnpm --filter pilotgb-api generate`
- Re-seed data: `pnpm --filter pilotgb-api db:seed`
- Tear down the database: `docker compose down -v`

## 8. SOW, Approvals, and Onboarding Workflows
- **Project Onboarding**: Create initiatives with `POST /api/initiatives` or retire them with `DELETE /api/initiatives/:id`. The web UI exposes a full project creation form for scope metadata, owners, and initial metrics.
- **Scope of Work**: Update summary, deliverables, or sign-offs via `PATCH /api/initiatives/:id/sow`. Setting `pmApproved` and `architectApproved` to `true` auto-promotes the status to `APPROVED`. Mark the contract as `SIGNED_OFF` once both approvals exist.
- **Data & AI Metrics**: Include structured payloads when calling the SOW endpoint to adjust data scope (`dataMetrics`) and AI scope (`aiMetrics`). Numeric inputs accept integers/floats; enums such as complexity, sensitivity, or deployment status must match the values in `schema.prisma`.
- **Stage Approvals**: Before advancing, obtain approvals from the assigned project manager and data architect through `PATCH /api/initiatives/:id/approvals/:approvalId`. The frontend exposes quick toggles per stage.
- **Team Directory**: Add new people with `POST /api/team-members` and assign them using `POST /api/initiatives/:id/team-members`. Remove assignments via `DELETE /api/initiatives/:id/team-members/:memberId`. The React UI surfaces dropdowns for everyday updates.
- **Access Provisioning**: Maintain access workflows under `/api/initiatives/:id/access/:accessId`; the UI lets you switch status without leaving the dashboard.
- **Lifecycle Enforcement**: The API blocks transitions when checklists, approvals, or SOW state are incomplete. Expect HTTP 400 responses with descriptive payloads if a gate is violated.
