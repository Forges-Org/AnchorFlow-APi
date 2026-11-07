import { Router } from 'express';
import { UserRole } from '../../shared/constants/roles.js';
import { asyncHandler } from '../../shared/http/asyncHandler.js';
import { requireAuth } from '../../shared/middleware/requireAuth.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/validation/validate.js';
import { idParamsSchema, routeBodySchema, routeListQuerySchema } from './anchorMonitoring.validation.js';
import {
  createRouteController,
  getRouteAlternativesController,
  getRouteDecisionController,
  listRouteDecisionsController,
  quoteRouteController,
} from './anchorMonitoring.controller.js';

export const anchorRoutesRouter = Router();
const readers = [requireAuth, requireRole(...Object.values(UserRole))];
const writers = [requireAuth, requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)];

anchorRoutesRouter.post('/', ...writers, validateRequest({ body: routeBodySchema }), asyncHandler(createRouteController));
anchorRoutesRouter.post('/quote', ...readers, validateRequest({ body: routeBodySchema }), asyncHandler(quoteRouteController));
anchorRoutesRouter.post('/alternatives', ...readers, validateRequest({ body: routeBodySchema }), asyncHandler(getRouteAlternativesController));
anchorRoutesRouter.get('/', ...readers, validateRequest({ query: routeListQuerySchema }), asyncHandler(listRouteDecisionsController));
anchorRoutesRouter.get('/:id', ...readers, validateRequest({ params: idParamsSchema }), asyncHandler(getRouteDecisionController));