import { Router } from 'express';
import { UserRole } from '../../shared/constants/roles.js';
import { asyncHandler } from '../../shared/http/asyncHandler.js';
import { requireAuth } from '../../shared/middleware/requireAuth.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/validation/validate.js';
import {
  compareFeesQuerySchema,
  createFeeBodySchema,
  feeListQuerySchema,
  idParamsSchema,
} from './anchorMonitoring.validation.js';
import {
  compareFeesController,
  createFeeController,
  getFeeController,
  getFeeHistoryController,
  listFeesController,
} from './anchorMonitoring.controller.js';

export const feesRouter = Router();
const readers = [requireAuth, requireRole(...Object.values(UserRole))];
const writers = [requireAuth, requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)];

feesRouter.get('/', ...readers, validateRequest({ query: feeListQuerySchema }), asyncHandler(listFeesController));
feesRouter.post('/', ...writers, validateRequest({ body: createFeeBodySchema }), asyncHandler(createFeeController));
feesRouter.get('/compare', ...readers, validateRequest({ query: compareFeesQuerySchema }), asyncHandler(compareFeesController));
feesRouter.get('/history', ...readers, validateRequest({ query: feeListQuerySchema }), asyncHandler(getFeeHistoryController));
feesRouter.get('/:id', ...readers, validateRequest({ params: idParamsSchema }), asyncHandler(getFeeController));