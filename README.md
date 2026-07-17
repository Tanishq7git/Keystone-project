# Project KEYSTONE — Field Service Management Platform

A full-stack field service platform built for Meridian Facilities Management: dispatchers raise
and assign work orders, technicians run them from the field, managers watch SLAs and
performance on a live dashboard, and customers self-serve requests through a portal.

Built for the Zidio Development Java Full-Stack Engineering brief.

## Stack

| Layer        | Technology                                              |
|--------------|----------------------------------------------------------|
| Backend      | Java 21 · Spring Boot 3.3 (Web, Security, Data JPA, Validation) |
| Auth         | Stateless JWT (jjwt) + Spring Security, BCrypt passwords  |
| Database     | PostgreSQL 16, versioned with Flyway                      |
| Frontend     | React 18 + TypeScript (Vite), Tailwind CSS, Recharts      |
| API docs     | springdoc-openapi / Swagger UI                             |

## Architecture

```
React SPA  →  Spring MVC Controllers  →  Services (business rules, state machine, @Transactional)
                                              →  Spring Data JPA Repositories  →  PostgreSQL (Flyway)
```

- **Controllers** are thin: validate input, enforce role via `@PreAuthorize`, delegate to services.
- **Services** hold all business logic — the work-order lifecycle, dispatch, SLA calculation,
  parts/stock transactions, and role-scoped queries. Every state change writes an append-only
  `work_order_status_history` row.
- **Repositories** use Spring Data JPA + `Specification` for dynamic, role-scoped filtering.
- **DTOs only** cross the API boundary — JPA entities never serialize directly to the client.
- **Authorization is server-side everywhere.** The UI hides buttons a role can't use, but every
  endpoint independently re-checks role (and, for technicians, that the job is actually assigned
  to them) with Spring Security method security — assume a determined caller hits the API directly.

### The work-order lifecycle (the core rule)

```
NEW → ASSIGNED → IN_PROGRESS ⇄ ON_HOLD → COMPLETED → CLOSED
 └───────┴───────────┘ (cancel)              └──→ IN_PROGRESS (reopen, manager only)
```

Encoded in `WorkOrderLifecycle` (backend/.../util) and enforced in `WorkOrderService` — illegal
jumps return `409 Conflict`, and role checks return `403 Forbidden`. Covered by
`WorkOrderLifecycleTest`.

## Running locally

### Option A — Docker Compose (fastest)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui.html

Flyway runs the schema + seed migrations automatically on first boot.

### Option B — Run backend and frontend separately

**Backend** (needs Java 21, Maven, and a running PostgreSQL 16):

```bash
cd backend
createdb keystone   # or: docker run -p 5432:5432 -e POSTGRES_DB=keystone -e POSTGRES_USER=keystone -e POSTGRES_PASSWORD=keystone postgres:16-alpine
mvn spring-boot:run
```

Environment variables (defaults shown work with the command above):

```
DB_URL=jdbc:postgresql://localhost:5432/keystone
DB_USERNAME=keystone
DB_PASSWORD=keystone
JWT_SECRET=change-this-super-secret-key-in-production-min-32-bytes-long
JWT_EXPIRATION_MS=86400000
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**Frontend** (needs Node 20+):

```bash
cd frontend
cp .env.example .env      # VITE_API_BASE_URL=http://localhost:8080/api
npm install
npm run dev                # http://localhost:5173
```

## Seed logins

Every seed account uses the password **`Password123!`**

| Role       | Email                     |
|------------|---------------------------|
| Dispatcher | dispatcher@keystone.dev   |
| Technician | tech1@keystone.dev        |
| Manager    | manager@keystone.dev      |
| Customer   | customer@keystone.dev     |

Seed data (`V2__seed_data.sql`) includes 3 customers, 6 sites, 6 parts, and 10 work orders spread
across every lifecycle state so every view has something to show on first login.

## Feature coverage (brief Section 09)

| # | Feature | Where |
|---|---------|-------|
| F1 | Auth & roles | `security/`, `SecurityConfig`, JWT + BCrypt + 4 roles |
| F2 | Customers & sites | `CustomerService`/`CustomerController`, `CustomersPage.tsx` |
| F3 | Work-order management | `WorkOrderService.create/update`, unique `WO-YYYY-NNNNN` codes |
| F4 | Dispatch & assignment | `WorkOrderService.assign`, Kanban board in `WorkOrdersPage.tsx` |
| F5 | Technician field view | Role-scoped `/work-orders` list, mobile-responsive |
| F6 | Parts & time logging | `PartService.logUsage` (transactional stock decrement), `TimeLogService` |
| F7 | SLA tracking & notifications | `SlaCalculator`, `SlaService` (scheduled breach check), `NotificationService` |
| F8 | Dashboard & reporting | `ReportingService`, `DashboardPage.tsx` (Recharts) |
| F9 | Customer portal | Customer-scoped work order creation/viewing |

## API documentation

Full OpenAPI/Swagger UI is served at `/swagger-ui.html` once the backend is running. A
representative endpoint slice:

```
POST /api/auth/login
GET  /api/work-orders                 (role-scoped, filterable, paginated)
POST /api/work-orders
POST /api/work-orders/{id}/assign
POST /api/work-orders/{id}/status      (lifecycle-guarded, 409 on illegal transitions)
POST /api/work-orders/{id}/parts       (transactional stock decrement)
POST /api/work-orders/{id}/time
GET  /api/reports/summary
```

## Tests

```bash
cd backend
mvn test
```

`WorkOrderLifecycleTest` locks down every legal/illegal transition and the role rules attached to
each — the two things Section 08 and 18.2 flag as the highest-risk areas to get wrong.

## Design notes

The UI uses a signature "keystone arch" mark (five stones, gold center stone) built as an inline
SVG component (`KeystoneMark.tsx`) rather than an external asset. Work-order status colors are
consistent everywhere (badges, board columns, charts): slate (New) → steel blue (Assigned) → gold
(In Progress) → rust (On Hold) → teal (Completed) → charcoal (Closed) → red (Cancelled).
