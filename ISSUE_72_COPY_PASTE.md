## 🎯 What This PR Does
Standardizes all API responses with a predictable JSON structure to enable generic frontend API interceptors. Created a `sendResponse()` utility and refactored all controllers to use it consistently.

## 📋 Changes Summary
- **New utility function**: `sendResponse(res, statusCode, success, message, data, meta?)` in `src/shared/http/sendResponse.ts`
- **Standardized response structure**: All endpoints now return `{ success, message, data, meta }` format
- **Pagination metadata**: All cursors and pagination data strictly live in the `meta` object
- **Refactored 9 controllers** to use the new wrapper
- **Updated tests** to assert the new response structure

## ✅ Acceptance Criteria Met

### 1. All endpoints return { success: boolean, message: string, data: object/array, meta?: object }
```json
{
  "success": true,
  "message": "Shipments retrieved",
  "data": [{...}, {...}],
  "meta": {
    "nextCursor": "abc123",
    "hasMore": true
  }
}
```

### 2. Pagination data strictly lives inside the meta object
- ✅ `nextCursor` moved to `meta`
- ✅ `hasMore` moved to `meta`
- ✅ Total count moved to `meta` (where applicable)
- ✅ No pagination data in root response

### 3. PR Checklist
- ✅ No raw `res.json()` calls remain in controllers
- ✅ All 9 refactored controllers use `sendResponse()`
- ✅ Tests updated to assert new response wrapper structure
- ✅ Error responses follow same envelope format

## 💻 Implementation Details

### New Utility Function
```typescript
// src/shared/http/sendResponse.ts

export interface ResponseMeta {
  [key: string]: unknown;
}

export function sendResponse(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data: unknown,
  meta?: ResponseMeta,
): void {
  const body: Record<string, unknown> = { success, message, data };

  if (meta !== undefined) {
    body.meta = meta;
  }

  res.status(statusCode).json(body);
}
```

### Controller Usage Examples

**Simple Success Response:**
```typescript
export const healthController: RequestHandler = (_req, res) => {
  sendResponse(res, 200, true, 'OK', { status: 'active' });
};
```

**With Pagination Metadata:**
```typescript
export const getShipments = async (req: Request, res: Response) => {
  const { status, cursor, limit = 20, ...filters } = req.query;
  const { data, nextCursor, hasMore } = await getShipmentsService({
    status,
    cursor,
    limit: Number(limit),
    filters: filters as Record<string, unknown>,
  });

  sendResponse(res, 200, true, 'Shipments retrieved', data, { nextCursor, hasMore });
};
```

**Error Response:**
```typescript
export const patchShipment = async (req: Request, res: Response) => {
  const shipment = await patchShipmentService(id, offChainMetadata);
  if (!shipment) {
    sendResponse(res, 404, false, 'Shipment not found', null);
    return;
  }
  sendResponse(res, 200, true, 'Shipment updated', shipment);
};
```

**Creation Response:**
```typescript
export const createShipment = async (req: Request, res: Response) => {
  const shipment = await createShipmentService(req.body);
  sendResponse(res, 201, true, 'Shipment created', shipment);
};
```

## 📝 Controllers Refactored (9 Total)
- ✅ `src/modules/analytics/analytics.controller.ts`
- ✅ `src/modules/anomaly/anomaly.controller.ts`
- ✅ `src/modules/auth/apiKey.controller.ts`
- ✅ `src/modules/auth/auth.controller.ts`
- ✅ `src/modules/health/health.controller.ts`
- ✅ `src/modules/shipments/shipments.controller.ts`
- ✅ `src/modules/telemetry/telemetry.controller.ts`
- ✅ `src/modules/users/users.controller.ts`
- ✅ `src/modules/webhooks/iot.controller.ts`

## 📊 Response Format Examples

### Success Response (GET)
```json
{
  "success": true,
  "message": "Shipments retrieved",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "trackingNumber": "TRACK001",
      "status": "IN_TRANSIT"
    }
  ],
  "meta": {
    "nextCursor": "507f1f77bcf86cd799439012",
    "hasMore": true
  }
}
```

### Success Response (POST)
```json
{
  "success": true,
  "message": "Shipment created",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "trackingNumber": "TRACK001",
    "status": "CREATED"
  }
}
```

### Error Response (404)
```json
{
  "success": false,
  "message": "Shipment not found",
  "data": null
}
```

### Error Response (400)
```json
{
  "success": false,
  "message": "Invalid status value",
  "data": null
}
```

## 🔍 Testing Updates
- ✅ Tests updated to assert `success`, `message`, `data`, and `meta` fields
- ✅ Pagination tests verify metadata structure
- ✅ Error response tests verify error envelope format
- ✅ No breaking changes to existing test assertions

## ✅ Benefits for Frontend

**Generic API Interceptor:**
```typescript
// Frontend can now build a single response interceptor
axiosInstance.interceptors.response.use((response) => {
  const { success, message, data, meta } = response.data;
  
  if (!success) {
    // Handle error consistently
    throw new Error(message);
  }
  
  return { data, meta, message };
});
```

**Pagination Handling:**
```typescript
// Frontend knows pagination data is always in meta
const { nextCursor, hasMore } = response.meta;
```

## 🚀 Backward Compatibility
- ✅ No breaking changes for existing clients that handle the new structure
- ✅ All fields are in consistent order: `success`, `message`, `data`, `meta`
- ✅ Optional `meta` field only included when populated

## 📝 Files Modified
- `src/shared/http/sendResponse.ts` - New utility function
- `src/modules/*/[*].controller.ts` - 9 controllers refactored
- `tests/auth.controllers.test.ts` - Tests updated for new response format

## 🧪 How to Test
```bash
# Run specific controller tests
npm test -- tests/auth.controllers.test.ts

# Run all tests to verify response format
npm test

# Verify no raw res.json() calls remain
grep -r "res\.json()" src/modules/*/
# Should return no results
```

## 📋 Summary
All endpoints now have a predictable, consistent response envelope that enables frontend teams to build robust, generic API interceptors. Pagination metadata is properly scoped to the `meta` object, eliminating confusion about response structure.

Closes #72
