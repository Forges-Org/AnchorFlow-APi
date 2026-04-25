# Navin Backend — Quality & Production-Readiness Backlog

This document contains exactly 40 highly constrained, AI-coding-agent-friendly issues. They have been synthesized from the provided Quality & Production-Readiness backlog and the findings of the recent Backend Audit. 

The format is standardized to allow programmatic extraction and automated creation via the GitHub CLI.

---

## Domain: Frontend Integration & API UX

### [API UX] Standardize API Response Wrappers
**Tier:** 🟢 Easy
**Labels:** `frontend-integration`, `enhancement`
**Description:** The frontend needs a predictable JSON structure for every response to build generic API interceptors. Create a utility function `sendResponse(res, statusCode, success, message, data, meta?)`. Refactor all controllers to use this wrapper.
**Acceptance Criteria:**
- All endpoints return `{ success: boolean, message: string, data: object/array, meta?: object }`.
- Pagination data (cursors, total pages) must strictly live inside the `meta` object.
**PR Checklist:**
- [ ] No raw `res.json()` calls remain in controllers.
- [ ] Tests updated to assert the new response wrapper.

### [API UX] Implement ISO 8601 Date Standardization
**Tier:** 🟢 Easy
**Labels:** `frontend-integration`, `bug`
**Description:** Timezone mismatches between the server and frontend cause UI bugs. Enforce UTC standard. Update all Mongoose schemas and API response serializers to strictly format dates as ISO 8601 strings (e.g., `2026-04-25T11:00:00.000Z`).
**Acceptance Criteria:**
- Mongoose getters/setters or response transformers map JS Dates to ISO strings.
- Frontend receives zero ambiguous timestamps (e.g., Unix epochs or localized strings).

### [API UX] Serve Swagger UI Dashboard
**Tier:** 🟢 Easy
**Labels:** `frontend-integration`, `documentation`
**Description:** Frontend developers need live documentation to test against. Install `swagger-ui-express` and `yamljs`. Serve our existing `docs/swagger.yaml` file at `GET /api-docs`.
**Acceptance Criteria:**
- `/api-docs` renders the interactive Swagger UI.
- The route is publicly accessible in development but disabled in production.

### [API UX] Implement CORS Configuration
**Tier:** 🟡 Medium
**Labels:** `frontend-integration`, `security`
**Description:** The browser will block frontend requests without proper CORS headers. Install `cors`. Create a middleware `src/config/cors.ts`. It must read an `ALLOWED_ORIGINS` environment variable (a comma-separated list) and dynamically allow or reject requests.
**Acceptance Criteria:**
- CORS successfully blocks requests from unlisted origins.
- Handles preflight `OPTIONS` requests correctly.

### [Data] Implement Soft Delete for Shipments and Users
**Tier:** 🟡 Medium
**Labels:** `data-integrity`, `enhancement`
**Description:** We cannot hard-delete records linked to blockchain transactions or telemetry history. Update the `Shipment` and `User` schemas to include a `deletedAt: Date | null` field. Override Mongoose `find`, `findOne`, and `aggregate` to automatically filter out documents where `deletedAt` is not null.
**Acceptance Criteria:**
- `DELETE` endpoints now set `deletedAt` instead of dropping the document.
- `GET` queries naturally ignore soft-deleted documents.

### [Tooling] Expand Seed Script for Specific UI Edge Cases
**Tier:** 🟡 Medium
**Labels:** `tooling`, `dx`
**Description:** The frontend needs specific data states to build dashboards (e.g., "A shipment stuck in transit for 5 days with 3 anomalies"). Update `src/scripts/seed.ts` to generate distinct scenarios: happy paths, severely delayed shipments, and shipments with pagination-heavy telemetry logs.
**Acceptance Criteria:**
- Seeder generates at least 3 explicitly tagged "edge case" shipments.
**PR Checklist:**
- [ ] Seeder still executes without crashing.

### [WebSockets] Centralize Socket Payload Schemas
**Tier:** 🟡 Medium
**Labels:** `websockets`, `typescript`
**Description:** The frontend needs TypeScript definitions for socket events. Create a shared `src/shared/types/socketEvents.ts` that exports strict interfaces for every payload sent via `io.emit()` (e.g., `TelemetryUpdatePayload`, `AnomalyAlertPayload`).
**Acceptance Criteria:**
- All `socket.emit` calls strictly type-check their payloads against these interfaces.

### [WebSockets] Implement Socket Disconnect/Cleanup Handlers
**Tier:** 🟢 Easy
**Labels:** `websockets`, `performance`
**Description:** Prevent memory leaks. Update `src/app.ts` (or the socket initialization file) to handle the `disconnect` event. Ensure the socket is removed from all tracking arrays/rooms and log the disconnection cleanly.
**Acceptance Criteria:**
- Server memory does not leak over thousands of connect/disconnect cycles.

### [API UX] Add API Response ETag Support for Client Caching
**Tier:** 🟢 Easy
**Labels:** `frontend-integration`, `performance`
**Description:** To optimize frontend rendering for large data payloads (like shipment lists or telemetry logs), implement ETag support globally. Ensure Express is configured to generate and compare ETags so clients can utilize `304 Not Modified` responses.
**Acceptance Criteria:**
- Repeated requests for unchanged resources return `304 Not Modified` without transferring the payload body.

---

## Domain: Advanced Testing & Coverage

### [Testing] Configure Global Jest Setup and Teardown
**Tier:** 🟡 Medium
**Labels:** `testing`, `tooling`
**Description:** Tests must run in isolation without bleeding data. Create a global setup/teardown script for Jest. It must spin up `mongodb-memory-server` before the suite runs, clear collections between every test file, and shut down the memory server afterward.
**Acceptance Criteria:**
- Tests no longer require a running local MongoDB instance.
- No database collisions occur when running tests in parallel.

### [Testing] Write Socket.io Client Integration Tests
**Tier:** 🔴 Hard
**Labels:** `testing`, `websockets`
**Description:** We must prove real-time events fire correctly. Using `socket.io-client`, write integration tests that authenticate a mock client, join a shipment room, trigger the `POST /api/webhooks/iot` HTTP endpoint, and assert that the client receives the expected WebSocket event.
**Dependencies:** `[Testing] Configure Global Jest Setup and Teardown`
**Acceptance Criteria:**
- HTTP-to-WebSocket pipeline is successfully verified in an automated test.

### [Testing] BullMQ Worker Failure and Retry Tests
**Tier:** 🟡 Medium
**Labels:** `testing`, `workers`
**Description:** We need to know our queues handle failures gracefully. Write unit tests for the Stellar worker that mock a `StellarSdk.TimeoutError`. Assert that BullMQ catches the error, increments the retry count, and eventually moves the job to the dead-letter queue (DLQ) if it exhausts retries.
**Acceptance Criteria:**
- Worker retry logic is proven to function without crashing the process.

### [Testing] RBAC Matrix Integration Tests
**Tier:** 🟡 Medium
**Labels:** `testing`, `security`
**Description:** Security cannot rely on assumptions. Create a test file specifically for the `requireRole` middleware. Create a matrix of all Roles (Admin, Manager, Viewer, Customer) multiplied by all protected endpoints. Assert 200s and 403s exactly match the required permissions.
**Acceptance Criteria:**
- Matrix strictly enforces that Viewers cannot trigger state changes, etc.

### [Testing] Implement API Snapshot Testing
**Tier:** 🟢 Easy
**Labels:** `testing`, `quality`
**Description:** Ensure API schemas don't drift silently. Write Jest snapshot tests for our primary `GET` endpoints (`/shipments`, `/anomalies`).
**Acceptance Criteria:**
- If a developer accidentally renames a database field that leaks into the API response, the snapshot test fails immediately.

### [Testing] Mock Time-Dependent Anomaly Tests
**Tier:** 🟡 Medium
**Labels:** `testing`, `analytics`
**Description:** Test the analytics engine. Use Jest's fake timers (`jest.useFakeTimers()`) to simulate an IoT sensor sending temperature data that slowly rises over 4 hours, asserting the exact moment the anomaly service triggers a `HIGH_TEMP` alert.
**Acceptance Criteria:**
- Time-series logic is verified without actually waiting 4 hours in the test runner.

### [Testing] Expand Test Coverage for Unauthorized Route Access
**Tier:** 🟡 Medium
**Labels:** `testing`, `security`
**Description:** The integration tests missed unprotected shipment routes because there were no explicit 401/403 test cases for endpoints like `PATCH /:id` and `POST /:id/proof`. Add exhaustive authentication denial tests for these specific endpoints in `shipments.test.ts`.
**Acceptance Criteria:**
- Tests verify that missing or invalid tokens reject the request, ensuring no regression on route protection.

---

## Domain: Developer Experience (DX) & Code Quality

### [Quality] Integrate Structured Logger (Winston/Pino)
**Tier:** 🟡 Medium
**Labels:** `dx`, `observability`
**Description:** Replace all `console.log` and `console.error` calls. Install `pino` (or `winston`). Configure it to output pretty logs in development, and strict JSON in production (for easy parsing by Datadog/AWS CloudWatch).
**Acceptance Criteria:**
- No `console.log` remains in the source code.
- Errors log with stack traces securely in development, but strip PII in production.

### [Quality] Enforce Environment Variable Validation
**Tier:** 🟢 Easy
**Labels:** `dx`, `security`
**Description:** The server should never boot if misconfigured. Install `zod`. In `src/env.ts`, create a Zod schema defining all required environment variables (e.g., `PORT`, `JWT_SECRET`, `MONGO_URI`). Parse `process.env` through this schema before the app starts.
**Acceptance Criteria:**
- Server throws an immediate, descriptive error on boot if an env variable is missing or malformed.

### [Quality] Setup Husky and Lint-Staged
**Tier:** 🟢 Easy
**Labels:** `dx`, `tooling`
**Description:** Stop bad code before it reaches GitHub. Install `husky` and `lint-staged`. Configure a `pre-commit` hook that runs Prettier formatting and ESLint auto-fixing on staged files only.
**Acceptance Criteria:**
- Commits are rejected if linting fails.

### [Quality] Refactor Magic Strings to Enums/Constants
**Tier:** 🟢 Easy
**Labels:** `dx`, `refactoring`
**Description:** Scan the codebase for "magic strings" (e.g., hardcoded status strings like `'IN_TRANSIT'`, role names like `'ADMIN'`, queue names like `'transaction_queue'`). Move these into a centralized `src/shared/constants` file as TypeScript Enums or `as const` objects.
**Acceptance Criteria:**
- Zero magic strings exist; everything relies on centralized enums.

### [Quality] Extract Mongoose Interfaces to Shared Types
**Tier:** 🟢 Easy
**Labels:** `dx`, `refactoring`
**Description:** Decouple Mongoose from our business logic. Extract the TypeScript interfaces defining our documents out of the Mongoose schema files and into `src/shared/types`.
**Acceptance Criteria:**
- Services can reference `IShipment` without importing Mongoose directly.

### [Quality] Standardize Error Code Dictionary
**Tier:** 🟡 Medium
**Labels:** `dx`, `error-handling`
**Description:** Create a centralized dictionary of application errors in `src/shared/errors.ts` (e.g., `ERR_AUTH_INVALID`, `ERR_SHIPMENT_NOT_FOUND`). Update the global error middleware to return these specific string codes to the frontend alongside the HTTP status.
**Acceptance Criteria:**
- Frontend can reliably switch on `response.error.code` for i18n translations.

### [Quality] Remove Redundant try/catch from Controllers
**Tier:** 🟢 Easy
**Labels:** `dx`, `refactoring`
**Description:** Controllers in `shipments.controller.ts` (e.g., `patchShipmentStatus`, `uploadShipmentProof`) manually catch errors and return raw JSON, bypassing the global error handler. Remove the internal `try/catch` blocks and rely entirely on `asyncHandler`.
**Acceptance Criteria:**
- Controllers cleanly delegate error throwing.
- Global error handler correctly picks up and formats these errors.

### [Quality] Standardize Synchronous Middleware Error Handling
**Tier:** 🟢 Easy
**Labels:** `dx`, `error-handling`
**Description:** The `requireAuth` middleware currently throws synchronous `AppError` exceptions rather than passing them to `next(err)`. This led to an awkward workaround where synchronous middleware is wrapped in `asyncHandler`. Refactor `requireAuth.ts` to use `next(new AppError(...))` and remove the `asyncHandler` wrappers around it in routes.
**Acceptance Criteria:**
- Middleware cleanly uses `next(err)` and does not require async wrappers inside route definitions.

### [Quality] Enforce Strict API Payload Validation with Zod
**Tier:** 🟡 Medium
**Labels:** `dx`, `validation`
**Description:** While some validation exists, we need a unified validation middleware. Create a generic Zod middleware `validateRequest(schema)` that strictly parses `req.body`, `req.query`, and `req.params`. Apply this across all route files to guarantee type safety before hitting controllers.
**Acceptance Criteria:**
- Invalid payloads trigger a `400 Bad Request` with structured validation error messages via the global error handler.

---

## Domain: Infrastructure & Deployability

### [Infra] Write Application Dockerfile
**Tier:** 🟡 Medium
**Labels:** `infrastructure`, `docker`
**Description:** Containerize the Node app. Write a multi-stage `Dockerfile`. Stage 1: Install dependencies and compile TypeScript. Stage 2: Copy only the compiled `dist` folder and production `node_modules` into a lightweight Node Alpine image.
**Acceptance Criteria:**
- Image builds successfully.
- Final image size is minimized (no TypeScript dev dependencies in the final layer).

### [Infra] Write Local `docker-compose.yml`
**Tier:** 🟢 Easy
**Labels:** `infrastructure`, `docker`
**Description:** Provide a one-click local environment. Write a compose file that spins up MongoDB, Redis, and the Node Backend application together on an internal network.
**Dependencies:** `[Infra] Write Application Dockerfile`
**Acceptance Criteria:**
- Running `docker-compose up` boots a fully functional API with connected databases.

### [Infra] Setup GitHub Actions CI Pipeline
**Tier:** 🟡 Medium
**Labels:** `infrastructure`, `ci-cd`
**Description:** Automate our quality gates. Create `.github/workflows/ci.yml`. On every Pull Request to `main`, the action must check out the code, setup Node.js, run `npm install`, `npm run lint`, and `npm run test`.
**Acceptance Criteria:**
- PRs show a green checkmark or red X based on automated test runs.

### [Infra] Integrate Database Migration Tool
**Tier:** 🟡 Medium
**Labels:** `infrastructure`, `database`
**Description:** Schema changes must be tracked. Install `migrate-mongo`. Set up the configuration and create an initial migration script that applies our new compound indexes programmatically.
**Acceptance Criteria:**
- Migrations can be run up and down reliably via npm scripts.

### [Infra] Implement Docker Healthchecks
**Tier:** 🟢 Easy
**Labels:** `infrastructure`, `docker`
**Description:** The load balancer needs to know if the app is truly alive. Update the Dockerfile and `docker-compose.yml` to utilize our `GET /api/health` endpoint as a native Docker healthcheck.
**Acceptance Criteria:**
- Container status shows as `healthy` or `unhealthy` rather than just `running`.

### [Infra] Implement Graceful Server Shutdown
**Tier:** 🟡 Medium
**Labels:** `infrastructure`, `resilience`
**Description:** When the process receives `SIGTERM` or `SIGINT`, the server currently terminates abruptly. Implement graceful shutdown logic in `app.ts` to stop accepting new requests, finish processing active HTTP requests, and cleanly close the MongoDB and Redis connections.
**Acceptance Criteria:**
- No active connections are dropped abruptly during a container restart or deployment.

### [Infra] Implement Database Connection Resiliency & Retries
**Tier:** 🟡 Medium
**Labels:** `infrastructure`, `database`
**Description:** Network blips between the API and MongoDB/Redis can cause crashes. Update the initialization logic in `src/infra` to include robust connection retry logic, exponential backoff, and event listeners for `disconnected` and `reconnected` states.
**Acceptance Criteria:**
- The application survives temporary database outages and successfully reconnects without requiring a container restart.

---

## Domain: Security & System Hardening

### [Security] Implement Helmet.js
**Tier:** 🟢 Easy
**Labels:** `security`, `dependencies`
**Description:** Secure HTTP headers automatically. Install `helmet` and configure it as global middleware in `src/app.ts` to mitigate basic XSS and clickjacking attacks.
**Acceptance Criteria:**
- Responses include secure headers (e.g., `X-Content-Type-Options`, `Strict-Transport-Security`).

### [Security] Strict Express Payload Limits
**Tier:** 🟢 Easy
**Labels:** `security`, `performance`
**Description:** Prevent denial-of-service via massive payloads. Configure `express.json({ limit: '100kb' })` and `express.urlencoded` globally. Create a custom, slightly larger limit specifically for the `POST /api/webhooks/iot` route if necessary.
**Acceptance Criteria:**
- API rejects massively bloated JSON payloads with a `413 Payload Too Large` error.

### [Security] Implement JWT Revocation/Blacklist
**Tier:** 🔴 Hard
**Labels:** `security`, `auth`
**Description:** If a user logs out or is compromised, their active JWT is currently valid until it expires. Implement a Redis-based blocklist. On logout, push the token's `jti` (JWT ID) to Redis with an expiration matching the token's remaining TTL. Update `requireAuth` to check Redis before granting access.
**Dependencies:** `[Infra] Setup Redis and BullMQ Queue Service`
**Acceptance Criteria:**
- Logged-out tokens immediately return `401 Unauthorized`.

### [Security] Secure WebSocket Origins
**Tier:** 🟡 Medium
**Labels:** `security`, `websockets`
**Description:** WebSockets don't respect CORS exactly like HTTP requests do. Update the Socket.io initialization to strictly enforce the `cors: { origin: [...] }` options to match the HTTP CORS configuration.
**Acceptance Criteria:**
- Cross-origin websocket connection attempts are rejected.

### [Security] Implement Mongoose Query Timeouts
**Tier:** 🟡 Medium
**Labels:** `security`, `database`
**Description:** Prevent bad queries from hanging the database. Update the global Mongoose connection or individual complex aggregation pipelines to utilize `.maxTimeMS(5000)`.
**Acceptance Criteria:**
- Heavy queries that take longer than 5 seconds are aborted, throwing an error caught by the global error handler.

### [Security] Secure Unprotected Shipment Endpoints
**Tier:** 🔴 Hard
**Labels:** `security`, `bug`
**Description:** The audit revealed that several critical shipment endpoints (`GET /`, `PATCH /:id`, `POST /:id/proof`) lack `requireAuth` and `requireRole` middlewares. Update `shipments.routes.ts` to correctly enforce authentication and authorization scopes.
**Acceptance Criteria:**
- Unauthenticated requests to these endpoints immediately return `401 Unauthorized`.
- Unprivileged users correctly receive a `403 Forbidden` response.

### [Security] Implement Rate Limiting on Authentication Routes
**Tier:** 🟡 Medium
**Labels:** `security`, `performance`
**Description:** Prevent brute-force password attacks and credential stuffing. Install `express-rate-limit` and configure a strict limit (e.g., 5 requests per 15 minutes) specifically mapped to the `POST /api/auth/login` endpoint.
**Acceptance Criteria:**
- Repeated failed logins result in a `429 Too Many Requests` response.

### [Security] Implement Audit Logging for Critical State Changes
**Tier:** 🟡 Medium
**Labels:** `security`, `observability`
**Description:** We need an immutable trail of who changed what for compliance and security auditing. Implement a lightweight audit logging utility that records when a user changes a shipment status, modifies RBAC roles, or generates an API key.
**Acceptance Criteria:**
- Critical actions generate a structured log entry detailing the `userId`, `action`, `resourceId`, and `timestamp`.
