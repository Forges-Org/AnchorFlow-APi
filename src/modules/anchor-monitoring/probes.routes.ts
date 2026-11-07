import { Router } from 'express';
import { UserRole } from '../../shared/constants/roles.js';
import { asyncHandler } from '../../shared/http/asyncHandler.js';
import { requireAuth } from '../../shared/middleware/requireAuth.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/validation/validate.js';
import {
  idParamsSchema,
  latestProbeQuerySchema,
  probeListQuerySchema,
  recordProbeBodySchema,
} from './anchorMonitoring.validation.js';
import {
  getLatestProbeController,
  getProbeController,
  listProbesController,
  recordProbeController,
} from './anchorMonitoring.controller.js';

export const probesRouter = Router();
const readers = [requireAuth, requireRole(...Object.values(UserRole))];
const writers = [requireAuth, requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)];

probesRouter.get('/', ...readers, validateRequest({ query: probeListQuerySchema }), asyncHandler(listProbesController));
probesRouter.post('/', ...writers, validateRequest({ body: recordProbeBodySchema }), asyncHandler(recordProbeController));
probesRouter.get('/latest', ...readers, validateRequest({ query: latestProbeQuerySchema }), asyncHandler(getLatestProbeController));
probesRouter.get('/:id', ...readers, validateRequest({ params: idParamsSchema }), asyncHandler(getProbeController));