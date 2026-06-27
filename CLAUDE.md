# Steel Store — Project Guide

MVP web app for a single steel store, used by a single admin to manage
products, record buy (import) and sell (sale) transactions, and view profit
over a date range. Built greenfield in 10 stages; this document is the
condensed reference. The full multi-stage plan lives at
`~/.claude/plans/snug-fluttering-shell.md`.

## Locked decisions

| Area | Decision |
|---|---|
| Backend | Spring Boot 4.1.x, Java 21 (revised from 3.x — 4.x is current GA) |
| Frontend | React 19 + Vite + TypeScript, Tailwind, shadcn/ui |
| DB | PostgreSQL 16 (Docker for dev) |
| Repo | Monorepo: `/backend`, `/frontend` |
| Auth | Single admin, username/password (BCrypt), JWT |
| Transaction model | First-class `bills` aggregate (IMPORT / SALE) with 1+ `transactions` lines; stock and profit derived from lines |
| Cost basis | Latest import price snapshotted onto each SALE line at write time |
| Concurrency | JPA `@Version` optimistic locking on Product + bounded retry at bill level |
| Duplicate requests | Client-generated `Idempotency-Key` header on the bill (UNIQUE in `bills.idempotency_key`) |
| Atomicity | All-or-nothing per bill — a single failing line rolls the whole bill back |
| Edit history | Immutable; corrections via counter-bill (linked by `correction_of_bill_id`) — negates every line |
| Oversell | Reject with 409 + clear message; never go negative |
| Currency | VND, `vi-VN` formatting (`1.000.000 ₫`) |
| Fonts | Be Vietnam Pro (UI) + IBM Plex Mono (numbers, tabular figures) |
| Design | Đức Phong design system: dark-ink sidebar, burnt-orange (`#ff6a1a`) accent, panel/chip/KPI primitives |

## Data model

- **users** — `id, username UNIQUE, password_hash, created_at`
- **products** — `id, name, unit, current_import_price, current_selling_price,
  current_stock, latest_import_date NULL, version BIGINT (JPA @Version),
  created_at, updated_at`
- **bills** — `id, type ENUM('IMPORT','SALE') (PG type `billtype`),
  party_name NULL, occurred_at, idempotency_key UNIQUE,
  correction_of_bill_id FK NULL, created_at`
- **transactions** (= bill lines) — `id, bill_id FK NOT NULL, product_id FK,
  quantity (signed; negative on counter-bill lines), unit_price,
  cost_basis_per_unit (SALE only — snapshot of product.current_import_price
  at line creation), total (generated), note NULL, created_at`

Profit over `[from, to]` =
`SUM((unit_price - cost_basis_per_unit) * quantity)` across SALE bill
lines, joining `bills` to filter by `type='SALE'` and `occurred_at`.
Counter-bill lines have negative quantity, so the same sum handles them.

**Known limitation**: reversing an IMPORT bill removes stock but does NOT
unwind `products.current_import_price` / `latest_import_date`. Record a
corrective import to fix the price if needed.

## Concurrency & idempotency contract

- All bill write endpoints (`POST /api/bills/*`) require an
  `Idempotency-Key` header (UUID). Missing → 400. Duplicate insert on
  `bills.idempotency_key` UNIQUE → fetch and return the existing bill
  (201 with the original payload).
- A bill (sale or import) is written all-or-nothing inside one
  `@Transactional` method:
  1. Reject if two lines reference the same `product_id`.
  2. Load every referenced product (JPA `@Version`).
  3. For each line:
     - SALE: if `quantity > product.current_stock` →
       `InsufficientStockException` → 409 (rolls back the whole bill).
       Snapshot `cost_basis_per_unit = product.current_import_price`.
       Decrement stock.
     - IMPORT: increment stock. Update `current_import_price` and
       `latest_import_date` from the line.
     - Save the product (triggers `@Version` check).
     - Insert the transaction (bill line).
  4. Save the `bills` row (cascades its lines).
- On `OptimisticLockingFailureException`: retry the WHOLE bill up to 3
  times with 25 / 50 / 100 ms backoff. Persistent failure → 409.
- Reverse: `POST /api/bills/{id}/reverse` (with its own `Idempotency-Key`)
  creates a counter-bill of the SAME type with negated quantities on every
  line, linked via `correction_of_bill_id`. Reversing a counter-bill or
  an already-reversed bill → 409.

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
| 4 | Bills (multi-line), optimistic locking, idempotency, atomic rollback | 50 parallel single-line SALE bills on stock=10 → exactly 10 succeed; multi-line oversell rolls back the whole bill; idempotent replay returns the same bill |
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
- **Fonts:** Be Vietnam Pro for UI text; IBM Plex Mono with
  `font-feature-settings: "tnum"` (`tabular-nums`) for all numeric cells.
  Use the `.mono` utility class on numeric cells.
- **Write endpoints:** `POST /api/bills/*` requires an `Idempotency-Key`
  header (UUID v4). Frontend `api.ts` auto-generates one per request; the
  bill builder pins a stable key for the lifetime of a draft so retries
  reuse it.
- **Bills are immutable.** No edits. Corrections are new counter-bills
  with `correction_of_bill_id` pointing at the original; every line's
  quantity is negated.
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
