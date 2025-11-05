# Task Manager Backend

Express + Prisma backend for a Task Management application.

Features
- Node.js + Express REST API
- PostgreSQL via Prisma ORM
- Models: Board, Task, Status (runtime-manageable)
- CRUD endpoints for Boards, Tasks, Statuses
- Validation and error handling (400, 404, 500)
- Security middlewares (helmet, cors, rate-limit, hpp, xss-clean, compression)
- Swagger UI mounted at /docs (openapi.yaml to be added)
- Docker & docker-compose for local development
- Helper scripts: remove duplicate boards, seed default statuses

Table of contents
- Prerequisites
- Quickstart (local)
- Quickstart (docker)
- Environment (.env)
- Scripts
- API (summary)
- Security notes
- Troubleshooting
- Next tasks & recommendations

Prerequisites
- Node.js (v18+ recommended) and npm
- PostgreSQL (or Docker)
- Docker & docker-compose (if you will run the project in containers)

Environment (.env)
Copy or edit the project `.env` and set at minimum:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
PORT=4000
ALLOWED_ORIGINS="http://localhost:3000"
USE_CSRF=false
NODE_ENV=development
```
When using docker-compose the compose file will provide a sensible default DATABASE_URL pointing to the `db` service if not set.

Quickstart — local (non-docker)
1. Install dependencies:
   npm install
2. Ensure PostgreSQL is running and DATABASE_URL is configured in `.env`.
3. Generate Prisma client:
   npx prisma generate
4. Apply migrations (development):
   npx prisma migrate dev --name init
   (if schema changed later: npx prisma migrate dev --name <name>)
5. Seed default statuses (TODO, IN_PROGRESS, DONE):
   node scripts/seed_statuses.js
6. Start dev server:
   npm run dev
7. API base:
   http://localhost:4000/api
   Swagger UI (when openapi.yaml is present):
   http://localhost:4000/docs

Quickstart — Docker (compose)
1. Build and start services:
   docker-compose up --build
2. Notes:
   - docker-compose spins up a Postgres service and the app.
   - If your host already has Postgres running and it binds 0.0.0.0:5432, you will get a port conflict. Either:
     - Stop your local Postgres, or
     - Edit `docker-compose.yml` and change the db ports mapping (e.g., "5433:5432"), and update DATABASE_URL accordingly, or
     - Remove the `ports` mapping for db if you only want the app to talk internally to the db container.
3. Seed statuses inside the running container (optional):
   docker-compose exec app node scripts/seed_statuses.js

Scripts
- node scripts/seed_statuses.js — seed default statuses: TODO, IN_PROGRESS, DONE
- node scripts/remove_duplicate_boards.js — destructive helper that removes duplicate boards keeping the earliest (used previously; run with care)

API Summary (endpoints)
All endpoints are mounted under /api.

Boards
- GET /api/boards
  - Returns all boards with their tasks (eager-loaded)
- POST /api/boards
  - Body: { "name": "Board Name" }
  - 400 if missing or duplicate
- PUT /api/boards/:id
  - Body: { "name": "New Name" }
  - 400 on conflict, 404 if not found
- DELETE /api/boards/:id
  - Deletes board and its tasks

Tasks
- POST /api/tasks
  - Body: { "title": "Task title", "boardId": 1, "description": "...", "statusId": 1 }
  - Alternative: pass "statusName" instead of statusId
  - If neither provided it tries to attach status named "TODO"
- PUT /api/tasks/:id
  - Update title, description, boardId, statusId or statusName
  - Pass statusId: null or statusName: null to unlink status
- DELETE /api/tasks/:id

Statuses (runtime-manageable)
- GET /api/statuses
- POST /api/statuses
  - Body: { "name": "Review" }
- PUT /api/statuses/:id
  - Body: { "name": "QA" }
- DELETE /api/statuses/:id
  - Unlinks tasks referencing this status (sets statusId = null) then deletes the status

Security & Hardening applied
- helmet — secure HTTP headers
- cors — configured via ALLOWED_ORIGINS
- express-rate-limit — global limiter (tunable)
- csurf (opt-in when USE_CSRF=true) — for cookie-based flows
- hpp — parameter pollution protection
- xss-clean — basic XSS sanitization
- compression — gzip/deflate responses
- Parsers limited to small bodies: express.json({ limit: '10kb' })

Repository layout (top-level)
- server.js
- package.json
- prisma/
  - schema.prisma
  - migrations/
- controllers/
  - boardController.js
  - taskController.js
  - statusController.js
- routes/router.js
- scripts/
  - seed_statuses.js
  - remove_duplicate_boards.js
- Dockerfile
- docker-compose.yml
- README.md


