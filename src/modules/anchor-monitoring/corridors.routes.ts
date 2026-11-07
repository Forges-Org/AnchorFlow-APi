import { Router } from 'express';
import { UserRole } from '../../shared/constants/roles.js';
import { asyncHandler } from '../../shared/http/asyncHandler.js';
import { requireAuth } from '../../shared/middleware/requireAuth.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/validation/validate.js';
import {
  attestationListQuerySchema,
  corridorIdParamsSchema,
  corridorListQuerySchema,
  createCorridorBodySchema,
  feeListQuerySchema,
  healthQuerySchema,
  updateCorridorBodySchema,
} from './anchorMonitoring.validation.js';
import {
  createCorridorController,
  deleteCorridorController,
  getCorridorAnchorsController,
  getCorridorAttestationsController,
  getCorridorController,
  getCorridorFeesController,
  getCorridorHealthController,
  listCorridorsController,
  updateCorridorController,
} from './anchorMonitoring.controller.js';

export const corridorsRouter = Router();
const readers = [requireAuth, requireRole(...Object.values(UserRole))];
const writers = [requireAuth, requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)];

corridorsRouter.get('/', ...readers, validateRequest({ query: corridorListQuerySchema }), asyncHandler(listCorridorsController));
corridorsRouter.post('/', ...writers, validateRequest({ body: createCorridorBodySchema }), asyncHandler(createCorridorController));
corridorsRouter.get('/:corridorId', ...readers, validateRequest({ params: corridorIdParamsSchema }), asyncHandler(getCorridorController));
corridorsRouter.patch(
  '/:corridorId',
  ...writers,
  validateRequest({ params: corridorIdParamsSchema, body: updateCorridorBodySchema }),
  asyncHandler(updateCorridorController)
);
corridorsRouter.delete('/:corridorId', ...writers, validateRequest({ params: corridorIdParamsSchema }), asyncHandler(deleteCorridorController));
corridorsRouter.get('/:corridorId/anchors', ...readers, validateRequest({ params: corridorIdParamsSchema }), asyncHandler(getCorridorAnchorsController));
corridorsRouter.get(
  '/:corridorId/health',
  ...readers,
  validateRequest({ params: corridorIdParamsSchema, query: healthQuerySchema }),
  asyncHandler(getCorridorHealthController)
);
corridorsRouter.get(
  '/:corridorId/fees',
  ...readers,
  validateRequest({ params: corridorIdParamsSchema, query: feeListQuerySchema }),
  asyncHandler(getCorridorFeesController)
);
corridorsRouter.get(
  '/:corridorId/attestations',
  ...readers,
  validateRequest({ params: corridorIdParamsSchema, query: attestationListQuerySchema }),
  asyncHandler(getCorridorAttestationsController)
);