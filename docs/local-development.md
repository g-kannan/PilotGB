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

## 2. Start PostgreSQL
The repository includes a Docker Compose service for PostgreSQL.

```bash
docker compose up -d db
```

Connection defaults:
- Host: `localhost`
- Port: `5432`
- User: `pilotgb`
- Password: `pilotgb`
- Database: `pilotgb`

## 3. Configure the API
1. Copy the environment template:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
2. Run Prisma client generation and push the schema:
   ```bash
   cd apps/api
   pnpm generate     # prisma generate
   pnpm db:push      # sync schema to Postgres
   pnpm db:seed      # load sample initiatives, assets, and risks
   cd ../..
   ```

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
- **Scope of Work**: Update summary, deliverables, or sign-offs via `PATCH /api/initiatives/:id/sow`. Setting `pmApproved` and `architectApproved` to `true` auto-promotes the status to `APPROVED`. Mark the contract as `SIGNED_OFF` once both approvals exist.
- **Stage Approvals**: Before advancing, obtain approvals from the assigned project manager and data architect through `PATCH /api/initiatives/:id/approvals/:approvalId`. The frontend exposes quick toggles per stage.
- **Team Onboarding**: Track staffing and access provisioning under `/api/initiatives/:id/team-members/:memberId` (onboarding status) and `/api/initiatives/:id/access/:accessId` (access workflow). The React UI surfaces selects for everyday updates.
- **Lifecycle Enforcement**: The API blocks transitions when checklists, approvals, or SOW state are incomplete. Expect HTTP 400 responses with descriptive payloads if a gate is violated.
