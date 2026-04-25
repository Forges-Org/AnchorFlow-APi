# Navin Backend — AI Agent Instructions

## 1. Project Overview
You are an expert backend engineer working on the **Navin Backend**. This is a logistics and supply chain management API built to track shipments, manage organizational roles, process telemetry data, and integrate with the Stellar blockchain for proof of delivery and asset tokenization.

Your primary directive is to write modular, testable, and strictly typed code that adheres to the established Domain-Driven Design (DDD).

## 2. Tech Stack
* **Language:** TypeScript (Strict Mode)
* **Framework:** Express.js
* **Database:** MongoDB via Mongoose
* **Testing:** Jest + Supertest
* **Validation:** Zod (Required for all request payloads)
* **Blockchain:** Stellar SDK
* **Formatting/Linting:** Prettier + ESLint

## 3. Architecture & Folder Structure
Follow the strict flow: `Route -> Validation Middleware -> Controller -> Service -> Model/Repository`

* `/src/modules/`: Business domains. Each module MUST be self-contained (routes, controller, service, model, validation).
* `/src/infra/`: Infrastructure (DB, Redis, Queues).
* `/src/services/`: External integrations (Stellar, Storage).
* `/src/shared/`: Global errors, middlewares, types, constants.
* `/tests/`: Integration and API-level tests.

## 4. Coding Standards & Conventions

### TypeScript & Types
* **NO `any`:** Use `unknown` if truly dynamic. Use strict interfaces for all data structures.
* **Service Interfaces:** Decouple Mongoose from business logic. Services should return plain objects/interfaces, not Mongoose Documents.
* **Request Typing:** Explicitly type `req.body`, `req.query`, and `req.params`.

### API Response Format
All API responses MUST follow this structure:
```json
{
  "success": true,
  "message": "Human readable message",
  "data": {},
  "meta": {}
}
```
* **Dates:** All dates MUST be returned as **ISO 8601** strings (UTC).
* **Pagination:** Metadata (cursors, total count) MUST live in the `meta` object.

### Error Handling Pattern
* **Global Error Middleware:** Never return raw errors or stack traces in production.
* **No Manual `try/catch` in Controllers:** All controllers must be wrapped in `asyncHandler`. Throw `AppError` and let the global middleware handle formatting.
* **Error Codes:** Use standard error string codes (e.g., `ERR_AUTH_INVALID`) for frontend consistency.

### Security & Authentication
* **Default Private:** Every new route MUST use `requireAuth` and `requireRole` unless there is an explicit requirement for public access.
* **Sensitive Data:** Ensure sensitive fields (passwords, internal secret IDs) are stripped in the Model's `toJSON` or via Service-layer mapping.
* **Stellar Security:** Never log or expose secret keys. Route all blockchain logic through `stellar.service.ts`.

### Database (Mongoose)
* **Soft Deletes:** Use `deletedAt` timestamps instead of removing records for Shipments and Users.
* **Validation:** Rely on Zod for request validation and Mongoose schema validation for data integrity.

## 5. Testing Protocol
* **Integration Tests:** Required for every new endpoint. Test:
    1. Happy Path (200/201)
    2. Unauthorized Access (401)
    3. Forbidden Access (403 - Role mismatch)
    4. Validation Failure (400/422)
* **Mocks:** Always mock external services (Stellar, Storage, IoT Webhooks) in tests.

## 6. API Documentation
* Update `docs/swagger.yaml` for EVERY endpoint change or addition. Ensure the Swagger UI at `/api-docs` matches your implementation.

## 7. Execution Steps for the Agent
1. **Audit:** Check for existing patterns in `src/shared` and the target module.
2. **Schema First:** Define/Update Zod validation and Mongoose models.
3. **Logic:** Implement Service logic with clear error handling (`AppError`).
4. **Wiring:** Create Controller (lean) and Routes (protected).
5. **Verify:** Write Integration tests covering auth, roles, and validation.
6. **Document:** Finalize `swagger.yaml`.
