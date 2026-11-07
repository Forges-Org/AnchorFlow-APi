import { Router } from 'express';
import { UserRole } from '../../shared/constants/roles.js';
import { asyncHandler } from '../../shared/http/asyncHandler.js';
import { requireAuth } from '../../shared/middleware/requireAuth.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/validation/validate.js';
import {
  attestationListQuerySchema,
  createAttestationBodySchema,
  idParamsSchema,
  latestAttestationQuerySchema,
} from './anchorMonitoring.validation.js';
import {
  createAttestationController,
  getAttestationController,
  getLatestAttestationsController,
  listAttestationsController,
} from './anchorMonitoring.controller.js';

export const attestationsRouter = Router();
const readers = [requireAuth, requireRole(...Object.values(UserRole))];
const writers = [requireAuth, requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)];

attestationsRouter.get('/', ...readers, validateRequest({ query: attestationListQuerySchema }), asyncHandler(listAttestationsController));
attestationsRouter.post('/', ...writers, validateRequest({ body: createAttestationBodySchema }), asyncHandler(createAttestationController));
attestationsRouter.get('/latest', ...readers, validateRequest({ query: latestAttestationQuerySchema }), asyncHandler(getLatestAttestationsController));
attestationsRouter.get('/:id', ...readers, validateRequest({ params: idParamsSchema }), asyncHandler(getAttestationController));