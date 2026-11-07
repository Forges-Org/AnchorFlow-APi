import { Router } from 'express';
import { anchorsRouter } from './anchors.routes.js';
import { attestationsRouter } from './attestations.routes.js';
import { corridorsRouter } from './corridors.routes.js';
import { feesRouter } from './fees.routes.js';
import { healthObservationsRouter } from './health.routes.js';
import { probesRouter } from './probes.routes.js';
import { anchorRoutesRouter } from './routes.routes.js';

export const anchorMonitoringRouter = Router();

anchorMonitoringRouter.use('/anchors', anchorsRouter);
anchorMonitoringRouter.use('/corridors', corridorsRouter);
anchorMonitoringRouter.use('/health-observations', healthObservationsRouter);
anchorMonitoringRouter.use('/fees', feesRouter);
anchorMonitoringRouter.use('/routes', anchorRoutesRouter);
anchorMonitoringRouter.use('/probes', probesRouter);
anchorMonitoringRouter.use('/attestations', attestationsRouter);