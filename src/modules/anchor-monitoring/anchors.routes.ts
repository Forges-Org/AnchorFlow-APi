import { Router } from 'express';
import { UserRole } from '../../shared/constants/roles.js';
import { asyncHandler } from '../../shared/http/asyncHandler.js';
import { requireAuth } from '../../shared/middleware/requireAuth.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/validation/validate.js';
import {
  anchorIdParamsSchema,
  anchorListQuerySchema,
  attestationListQuerySchema,
  createAnchorBodySchema,
  feeListQuerySchema,
  healthQuerySchema,
  probeListQuerySchema,
  updateAnchorBodySchema,
} from './anchorMonitoring.validation.js';
import {
  createAnchorController,
  deleteAnchorController,
  getAnchorAttestationsController,
  getAnchorController,
  getAnchorFeesController,
  getAnchorHealthController,
  getAnchorProbesController,
  listAnchorsController,
  updateAnchorController,
} from './anchorMonitoring.controller.js';

export const anchorsRouter = Router();
const readers = [requireAuth, requireRole(...Object.values(UserRole))];
const writers = [requireAuth, requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)];

anchorsRouter.get('/', ...readers, validateRequest({ query: anchorListQuerySchema }), asyncHandler(listAnchorsController));
anchorsRouter.post('/', ...writers, validateRequest({ body: createAnchorBodySchema }), asyncHandler(createAnchorController));
anchorsRouter.get('/:anchorId', ...readers, validateRequest({ params: anchorIdParamsSchema }), asyncHandler(getAnchorController));
anchorsRouter.patch(
  '/:anchorId',
  ...writers,
  validateRequest({ params: anchorIdParamsSchema, body: updateAnchorBodySchema }),
  asyncHandler(updateAnchorController)
);
anchorsRouter.delete('/:anchorId', ...writers, validateRequest({ params: anchorIdParamsSchema }), asyncHandler(deleteAnchorController));
anchorsRouter.get(
  '/:anchorId/health',
  ...readers,
  validateRequest({ params: anchorIdParamsSchema, query: healthQuerySchema }),
  asyncHandler(getAnchorHealthController)
);
anchorsRouter.get(
  '/:anchorId/fees',
  ...readers,
  validateRequest({ params: anchorIdParamsSchema, query: feeListQuerySchema }),
  asyncHandler(getAnchorFeesController)
);
anchorsRouter.get(
  '/:anchorId/probes',
  ...readers,
  validateRequest({ params: anchorIdParamsSchema, query: probeListQuerySchema }),
  asyncHandler(getAnchorProbesController)
);
anchorsRouter.get(
  '/:anchorId/attestations',
  ...readers,
  validateRequest({ params: anchorIdParamsSchema, query: attestationListQuerySchema }),
  asyncHandler(getAnchorAttestationsController)
);