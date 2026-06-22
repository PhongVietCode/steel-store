# Steel Store

Internal MVP web app for a single steel store. One admin uses it to manage
products, record imports and sales, and view profit over a date range.

## Tech stack

- **Backend:** Spring Boot 3.x on Java 21 (Gradle)
- **Frontend:** React 19 + Vite + TypeScript, Tailwind, shadcn/ui
- **Database:** PostgreSQL 16 (via Docker Compose for dev)
- **Auth:** Single admin, username/password (BCrypt) + JWT

## Quick start (dev)

```bash
docker compose up -d        # starts Postgres on :5432
docker compose ps           # should show steelstore-postgres (healthy)
```

Backend and frontend are added in later stages:

- `/backend` — Spring Boot service (Stage 1+)
- `/frontend` — Vite + React app (Stage 6+)

## More

See [`CLAUDE.md`](./CLAUDE.md) for the condensed plan, data model,
concurrency contract, and conventions.
