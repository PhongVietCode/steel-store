# Steel Store — Project Guide

MVP web app for a single steel store, used by a single admin to manage
products, record buy (import) and sell (sale) transactions, and view profit
over a date range. Built greenfield in 10 stages; this document is the
condensed reference. The full multi-stage plan lives at
`~/.claude/plans/snug-fluttering-shell.md`.

## Locked decisions

| Area | Decision |
|---|---|
| Backend | Spring Boot 3.x, Java 21 |
| Frontend | React 19 + Vite + TypeScript, Tailwind, shadcn/ui |
| DB | PostgreSQL 16 (Docker for dev) |
| Repo | Monorepo: `/backend`, `/frontend` |
| Auth | Single admin, username/password (BCrypt), JWT |
| Transaction model | Full transaction log (IMPORT / SALE rows); stock and profit derived from it |
| Cost basis | Latest import price snapshotted onto each sale row at write time |
| Concurrency | JPA `@Version` optimistic locking on Product + bounded retry |
| Duplicate requests | Client-generated `Idempotency-Key` header + UNIQUE index in DB |
| Edit history | Immutable; corrections via counter-transaction (linked by `correction_of_id`) |
| Oversell | Reject with 409 + clear message; never go negative |
| Currency | VND, `vi-VN` formatting (`1.000.000 ₫`) |
| Fonts | Be Vietnam Pro (UI) + JetBrains Mono (numbers, tabular figures) |

## Data model

- **users** — `id, username UNIQUE, password_hash, created_at`
- **products** — `id, name, unit, current_import_price, current_selling_price,
  current_stock, latest_import_date NULL, version BIGINT (JPA @Version),
  created_at, updated_at`
- **transactions** — `id, type ENUM('IMPORT','SALE'), product_id FK,
  quantity, unit_price, cost_basis_per_unit (SALE only — snapshot of
  product.current_import_price), total (generated), occurred_at,
  idempotency_key UNIQUE, correction_of_id FK NULL, note NULL`

Profit over `[from, to]` =
`SUM((unit_price - cost_basis_per_unit) * quantity)` across SALE rows in
range. Corrections store negative quantity, so the same sum handles them.

## Concurrency & idempotency contract

- All write endpoints accept an `Idempotency-Key` header (UUID).
  Missing → 400. Duplicate insert on `transactions.idempotency_key` UNIQUE
  → fetch and return the existing row (200 with original payload).
- Sale flow inside one `@Transactional` method:
  1. Load product (JPA `@Version` increments on update).
  2. If `quantity > product.current_stock` → `InsufficientStockException`
     → 409.
  3. Snapshot `cost_basis_per_unit = product.current_import_price`.
  4. Decrement stock; save product (triggers version check).
  5. Insert transaction row.
- On `OptimisticLockingFailureException`: retry up to 3 times with
  25 / 50 / 100 ms backoff. Persistent failure → 409 with retry guidance.
- Import flow: same shape; increments stock; updates `current_import_price`
  and `latest_import_date`.

## Repo layout

```
steel-store/
├── README.md
├── CLAUDE.md
├── docker-compose.yml
├── backend/                  # Spring Boot, Gradle (Stage 1+)
│   └── src/main/java/com/steelstore/...
└── frontend/                 # Vite + React + TS (Stage 6+)
    └── src/...
```

## Stages

| # | Scope | Done when |
|---|---|---|
| 0 | Repo & dev infra (this commit) | `docker compose up -d` brings Postgres up; repo is committable |
| 1 | Backend skeleton (Spring Boot + Flyway init) | `./gradlew bootRun` starts; Flyway migrates; `/actuator/health` UP |
| 2 | Auth (BCrypt + JWT, login endpoint) | Login returns JWT; protected endpoint 401 without, 200 with |
| 3 | Product CRUD + validation + integration tests | Full CRUD round-trip; tests green |
| 4 | Transactions, optimistic locking, idempotency | 50 parallel sales on stock=10 → exactly 10 succeed; idempotency test green |
| 5 | Profit reporting endpoint | Report numbers match hand-computed expected values in tests |
| 6 | Frontend skeleton (Vite + Tailwind + shadcn + auth wiring) | `npm run dev` shows login → empty dashboard after auth |
| 7 | Frontend products UI | Admin can manage products end-to-end via UI |
| 8 | Frontend transactions UI (imports, sales, history, reverse) | Full buy/sell loop in browser; oversell shows friendly error |
| 9 | Frontend dashboard + profit report | Dashboard matches backend report for any date range |
| 10 | Polish, Dockerfiles, compose for whole app | `docker compose up` from clean clone produces a working app at `http://localhost` |

## Conventions

- **Currency:** Format with `Intl.NumberFormat('vi-VN', { style: 'currency',
  currency: 'VND' })`. Store as integer minor units? **No** — VND has no
  fractional units; store as plain `BIGINT` (whole đồng).
- **Fonts:** Be Vietnam Pro for UI text; JetBrains Mono with
  `font-feature-settings: "tnum"` (`tabular-nums`) for all numeric cells.
- **Write endpoints:** Every POST / PUT requires `Idempotency-Key` header
  (UUID v4). Frontend `axios` interceptor generates one per request.
- **Transactions are immutable.** No edits. Corrections are new rows with
  `correction_of_id` pointing at the original; quantity is signed (negative
  on a SALE reverse, etc.).
- **Errors:** Backend returns RFC 7807 `ProblemDetail`. Frontend toasts the
  `title` / `detail` and pulls structured fields (e.g. `currentStock`,
  `requested`) when present.

## Run / dev

```bash
# Database (Stage 0+)
docker compose up -d
docker compose ps                   # should be (healthy)
docker compose down                 # stop, keep volume
docker compose down -v              # stop, wipe data

# Backend (Stage 1+)
cd backend
./gradlew bootRun
./gradlew test                      # Testcontainers Postgres

# Frontend (Stage 6+)
cd frontend
npm install
npm run dev
```

### Dev Postgres credentials (hardcoded for dev only)

```
host=localhost port=5432 db=steelstore user=steelstore password=steelstore
```

A real `.env.example` lands in Stage 10.
