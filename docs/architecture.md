# PilotGB Application Architecture

## Overview
PilotGB is delivered as a full-stack TypeScript application composed of a PostgreSQL-backed API service and a React single-page client. The stack was selected to support rapid iteration while meeting the domain requirements around lifecycle visibility, SOW governance, and health insights.

```
[React SPA]  <--->  [REST API (Express + Zod)]  <--->  [Prisma ORM]  <--->  [PostgreSQL]
```

## Service Responsibilities
- **Client (Vite + React + TanStack Query)**  
  Provides lifecycle Kanban boards, SOW governance workspace, onboarding dashboards, and health/risk analytics. Communicates exclusively with the API via fetch calls.
- **API (Express + Prisma)**  
  Exposes REST endpoints for initiatives, stage transitions, SOW records, approvals, onboarding tasks, data assets, risks, dependencies, and health metrics. Enforces stage progression rules, SOW linkage, approval gates, and checklist validation.
- **Database (PostgreSQL)**  
  Stores all domain data. Prisma generates type-safe client code and migrations.

## Domain Model Summary
- **Initiative**: Top-level unit of work tied to a SOW. Contains stage, status, schedule, and progression metadata.
- **StageHistory**: Immutable log of initiative stage transitions with timestamps, actors, and exit notes.
- **ChecklistItem**: Stage-specific quality gates (e.g., validation suite run, stakeholder sign-off) that must be complete before advancing.
- **DataAsset**: Datasets, models, dashboards, or pipelines linked to initiatives with acceptance criteria and owners.
- **Risk**: Captures risk statements, severity, mitigation plan, and lifecycle linkage.
- **Dependency**: Upstream/downstream blockers, referenced either within PilotGB or external systems.
- **ScopeOfWork**: Canonical definition of scope, deliverables, and ownership. Tracks sign-off status for the project manager and data architect and timestamps approvals.
- **StageApproval**: Role-based approvals required to exit each lifecycle stage (currently PM + Data Architect). Enforced before transitions and reset when a new stage is entered.
- **TeamMember**: Resource roster with onboarding status, role title, and home team.
- **InitiativeAssignment**: Join table linking people to initiatives with responsibility context.
- **AccessProvision**: Access provisioning tasks per team member and initiative, including system, status, and fulfillment timestamps.

Stage order is fixed (`INGESTION -> TRANSFORMATION -> ENRICHMENT -> VALIDATION -> VISUALIZATION -> DEPLOYMENT`). The API validates forward-only transitions, SOW readiness, and completed checklists. Regressions require an explicit override flag. Exiting a stage also mandates recorded approvals from the assigned project manager and data architect.

## Cross-Cutting Concerns
- **Validation**: All request payloads are validated with Zod schemas to ensure consistent API contracts.
- **Error Handling**: Centralized Express error middleware formats domain and validation errors.
- **Observability**: Logging middleware captures request/response metadata (extendable to structured logging providers).
- **Security**: Ready for JWT or session authentication; current scope focuses on local development.

## Local Development Flow
1. Run PostgreSQL via Docker Compose (`docker compose up -d db`).
2. Apply Prisma migrations and seed (`pnpm db:migrate && pnpm db:seed`).
3. Start API (`pnpm dev` inside `apps/api`).
4. Start client (`pnpm dev` inside `apps/web`).

The monorepo uses `pnpm` workspaces to share TypeScript configuration and domain constants.
