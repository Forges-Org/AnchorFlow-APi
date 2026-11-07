import { Router } from 'express';
import { UserRole } from '../../shared/constants/roles.js';
import { asyncHandler } from '../../shared/http/asyncHandler.js';
import { requireAuth } from '../../shared/middleware/requireAuth.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/validation/validate.js';
import {
  compareHealthQuerySchema,
  healthQuerySchema,
  latestHealthQuerySchema,
  recordHealthBodySchema,
} from './anchorMonitoring.validation.js';
import {
  compareHealthController,
  getHealthHistoryController,
  getLatestHealthController,
  recordHealthController,
} from './anchorMonitoring.controller.js';

export const healthObservationsRouter = Router();
const readers = [requireAuth, requireRole(...Object.values(UserRole))];
const writers = [requireAuth, requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)];

healthObservationsRouter.post('/', ...writers, validateRequest({ body: recordHealthBodySchema }), asyncHandler(recordHealthController));
healthObservationsRouter.get(
  '/latest',
  ...readers,
  validateRequest({ query: latestHealthQuerySchema }),
  asyncHandler(getLatestHealthController)
);
healthObservationsRouter.get(
  '/history',
  ...readers,
  validateRequest({ query: healthQuerySchema }),
  asyncHandler(getHealthHistoryController)
);
healthObservationsRouter.get(
  '/compare',
  ...readers,
  validateRequest({ query: compareHealthQuerySchema }),
  asyncHandler(compareHealthController)
);