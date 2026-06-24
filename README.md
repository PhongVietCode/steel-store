# Steel Store

Internal MVP web app for a single steel store. One admin manages products,
records imports / sales, reverses mistakes, and views profit over a date
range. UI is in Vietnamese; amounts are VND.

## Tech stack

- **Backend:** Spring Boot 4.1 on Java 21 (Gradle 9). JPA + Flyway,
  Spring Security with HS256 JWT (`oauth2-resource-server`), optimistic
  locking with bounded retry, idempotency on transaction writes.
- **Frontend:** React 19 + Vite + TypeScript, Tailwind v4, hand-written
  shadcn-style primitives, TanStack Query 5, react-hook-form + zod,
  Recharts.
- **DB:** PostgreSQL 16.
- **Auth:** single admin (`admin` / `admin` by default), BCrypt + JWT.

## Quick start — full stack via Docker

```bash
docker compose up -d --build
# wait ~30s for everything to come healthy
open http://localhost
```

- Frontend: <http://localhost> (nginx)
- Backend API: proxied at `/api/*`, also directly at <http://localhost:8080>
- Default login: `admin` / `admin` — change before exposing.

To override secrets, copy `.env.example` to `.env` and edit:

```bash
cp .env.example .env
# set JWT_SECRET (openssl rand -base64 32), ADMIN_PASSWORD, etc.
docker compose up -d --build
```

The backend's `AdminPasswordRunner` will rotate the seeded admin
password to `ADMIN_PASSWORD` on first boot when it differs.

## Dev mode (live reload, no rebuild)

Three terminals:

```bash
# 1. Postgres only
docker compose up -d postgres

# 2. Backend (Java 21 + Gradle 9 wrapper)
cd backend
./gradlew bootRun

# 3. Frontend (Vite dev server, proxies /api -> :8080)
cd frontend
npm install
npm run dev
```

- Frontend dev: <http://localhost:5173>
- Backend tests (Testcontainers spins its own Postgres):
  `./gradlew test`

## Manual API smoke

See [`backend/api.http`](./backend/api.http) — JetBrains HTTP file with
login, products CRUD, and the transaction round-trip. Token is captured
into a global, so the rest of the requests work after the Login one.

## Configuration reference

All env vars are documented in [`.env.example`](./.env.example).
Key ones:

| Var | Purpose | Dev default |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Postgres bootstrap | `steelstore` |
| `JWT_SECRET` | HS256 signing key, base64 (≥ 32 bytes) | committed dev value |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | If `ADMIN_PASSWORD` set, rotates the seeded admin password on boot | `admin` / *(empty: keep dev seed)* |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated origins permitted by the API | `http://localhost` (compose) / `http://localhost:5173` (dev) |

## Project layout

```
steel-store/
├── docker-compose.yml         # postgres + backend + frontend
├── .env.example
├── backend/                   # Spring Boot 4 service
│   ├── Dockerfile             # multi-stage, distroless runtime
│   ├── build.gradle
│   ├── api.http
│   └── src/
│       ├── main/java/com/steelstore/{auth,product,transaction,report,api,config}
│       └── main/resources/{application.yml, db/migration/V*.sql}
└── frontend/                  # Vite + React + TS
    ├── Dockerfile             # build -> nginx alpine
    ├── nginx.conf
    └── src/{pages,components,lib}
```

## Notes

- Read [`CLAUDE.md`](./CLAUDE.md) for the data model, the concurrency +
  idempotency contract, locked decisions, and the stage-by-stage plan.
- All money is `BIGINT` whole-đồng (VND has no fractional unit), formatted
  with `Intl.NumberFormat('vi-VN', { currency: 'VND' })` and the
  `tabular-nums` utility (JetBrains Mono with `font-feature-settings: tnum`).
- Transactions are immutable; corrections are new rows with
  `correction_of_id` and signed (often negative) `quantity`.
- The report endpoint and dashboard treat date ranges in
  `Asia/Ho_Chi_Minh`.
