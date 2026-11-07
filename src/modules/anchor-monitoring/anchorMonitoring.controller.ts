import type { RequestHandler, Response } from 'express';
import { sendResponse } from '../../shared/http/sendResponse.js';
import type { ResponseMeta } from '../../shared/http/sendResponse.js';
import {
  compareFees,
  compareHealth,
  createAnchor,
  createAttestation,
  createCorridor,
  createFee,
  createRouteDecision,
  getAnchor,
  getAnchorFees,
  getAnchorHealth,
  getAttestation,
  getAttestationHistory,
  getCorridor,
  getCorridorAnchors,
  getCorridorFees,
  getCorridorHealth,
  getFee,
  getFeeHistory,
  getHealthHistory,
  getLatestAttestations,
  getLatestHealth,
  getLatestProbe,
  getProbe,
  getProbeHistory,
  getRouteDecision,
  getRouteAlternatives,
  listAnchors,
  listAttestations,
  listCorridors,
  listFees,
  listProbes,
  listRouteDecisions,
  quoteRoute,
  recordHealth,
  recordProbe,
  updateAnchor,
  updateCorridor,
  deleteAnchor,
  deleteCorridor,
} from './anchorMonitoring.service.js';
import type {
  AnchorListQuery,
  AttestationListQuery,
  CorridorListQuery,
  FeeListQuery,
  HealthQuery,
  ProbeListQuery,
  RouteListQuery,
} from './anchorMonitoring.validation.js';

function sendPage(res: Response, message: string, result: { data: unknown; meta: ResponseMeta }): void {
  sendResponse(res, 200, true, message, result.data, result.meta);
}

export const listAnchorsController: RequestHandler = async (req, res) => {
  sendPage(res, 'Anchors retrieved', await listAnchors(req.query as unknown as AnchorListQuery));
};
export const createAnchorController: RequestHandler = async (req, res) => {
  sendResponse(res, 201, true, 'Anchor created', await createAnchor(req.body as Record<string, unknown>));
};
export const getAnchorController: RequestHandler = async (req, res) => {
  sendResponse(res, 200, true, 'Anchor retrieved', await getAnchor(req.params.anchorId));
};
export const updateAnchorController: RequestHandler = async (req, res) => {
  sendResponse(
    res,
    200,
    true,
    'Anchor updated',
    await updateAnchor(req.params.anchorId, req.body as Record<string, unknown>)
  );
};
export const deleteAnchorController: RequestHandler = async (req, res) => {
  sendResponse(res, 200, true, 'Anchor deleted', await deleteAnchor(req.params.anchorId));
};
export const getAnchorHealthController: RequestHandler = async (req, res) => {
  sendPage(
    res,
    'Anchor health history retrieved',
    await getAnchorHealth(req.params.anchorId, req.query as unknown as HealthQuery)
  );
};
export const getAnchorFeesController: RequestHandler = async (req, res) => {
  sendPage(
    res,
    'Anchor fee history retrieved',
    await getAnchorFees(req.params.anchorId, req.query as unknown as FeeListQuery)
  );
};
export const getAnchorProbesController: RequestHandler = async (req, res) => {
  sendPage(
    res,
    'Anchor probe history retrieved',
    await getProbeHistory(req.params.anchorId, {
      ...(req.query as unknown as ProbeListQuery),
      anchorId: req.params.anchorId,
    })
  );
};

export const listCorridorsController: RequestHandler = async (req, res) => {
  sendPage(res, 'Corridors retrieved', await listCorridors(req.query as unknown as CorridorListQuery));
};
export const createCorridorController: RequestHandler = async (req, res) => {
  sendResponse(res, 201, true, 'Corridor created', await createCorridor(req.body));
};
export const getCorridorController: RequestHandler = async (req, res) => {
  sendResponse(res, 200, true, 'Corridor retrieved', await getCorridor(req.params.corridorId));
};
export const updateCorridorController: RequestHandler = async (req, res) => {
  sendResponse(res, 200, true, 'Corridor updated', await updateCorridor(req.params.corridorId, req.body));
};
export const deleteCorridorController: RequestHandler = async (req, res) => {
  sendResponse(res, 200, true, 'Corridor deleted', await deleteCorridor(req.params.corridorId));
};
export const getCorridorAnchorsController: RequestHandler = async (req, res) => {
  sendResponse(res, 200, true, 'Corridor anchors retrieved', await getCorridorAnchors(req.params.corridorId));
};
export const getCorridorHealthController: RequestHandler = async (req, res) => {
  sendPage(
    res,
    'Corridor health history retrieved',
    await getCorridorHealth(req.params.corridorId, req.query as unknown as Pick<HealthQuery, 'page' | 'limit'>)
  );
};

export const recordHealthController: RequestHandler = async (req, res) => {
  sendResponse(res, 201, true, 'Health observation recorded', await recordHealth(req.body));
};
export const getLatestHealthController: RequestHandler = async (req, res) => {
  sendResponse(
    res,
    200,
    true,
    'Latest health retrieved',
    await getLatestHealth(req.query as unknown as Pick<HealthQuery, 'anchorId' | 'corridorId'>)
  );
};
export const getHealthHistoryController: RequestHandler = async (req, res) => {
  sendPage(res, 'Health history retrieved', await getHealthHistory(req.query as unknown as HealthQuery));
};
export const compareHealthController: RequestHandler = async (req, res) => {
  const query = req.query as unknown as { anchorIds: string[] };
  sendResponse(res, 200, true, 'Health comparison retrieved', await compareHealth(query.anchorIds));
};

export const listFeesController: RequestHandler = async (req, res) => {
  sendPage(res, 'Fee snapshots retrieved', await listFees(req.query as unknown as FeeListQuery));
};
export const createFeeController: RequestHandler = async (req, res) => {
  sendResponse(res, 201, true, 'Fee snapshot recorded', await createFee(req.body));
};
export const getFeeController: RequestHandler = async (req, res) => {
  sendResponse(res, 200, true, 'Fee snapshot retrieved', await getFee(req.params.id));
};
export const compareFeesController: RequestHandler = async (req, res) => {
  const query = req.query as unknown as { assetCode: string; countryCode: string; amount: number };
  sendResponse(res, 200, true, 'Fees compared', await compareFees(query));
};
export const getFeeHistoryController: RequestHandler = async (req, res) => {
  sendPage(res, 'Fee history retrieved', await getFeeHistory(req.query as unknown as FeeListQuery));
};
export const getCorridorFeesController: RequestHandler = async (req, res) => {
  const query = req.query as unknown as Pick<FeeListQuery, 'page' | 'limit'>;
  sendPage(res, 'Corridor fee history retrieved', await getCorridorFees(req.params.corridorId, query));
};

export const createRouteController: RequestHandler = async (req, res) => {
  sendResponse(res, 201, true, 'Route selected', await createRouteDecision(req.body));
};
export const quoteRouteController: RequestHandler = async (req, res) => {
  sendResponse(res, 200, true, 'Route quote generated', await quoteRoute(req.body));
};
export const getRouteAlternativesController: RequestHandler = async (req, res) => {
  sendResponse(res, 200, true, 'Route alternatives retrieved', await getRouteAlternatives(req.body));
};
export const listRouteDecisionsController: RequestHandler = async (req, res) => {
  sendPage(res, 'Route history retrieved', await listRouteDecisions(req.query as unknown as RouteListQuery));
};
export const getRouteDecisionController: RequestHandler = async (req, res) => {
  sendResponse(res, 200, true, 'Route decision retrieved', await getRouteDecision(req.params.id));
};

export const listProbesController: RequestHandler = async (req, res) => {
  sendPage(res, 'Probe runs retrieved', await listProbes(req.query as unknown as ProbeListQuery));
};
export const recordProbeController: RequestHandler = async (req, res) => {
  sendResponse(res, 201, true, 'Probe result recorded', await recordProbe(req.body));
};
export const getProbeController: RequestHandler = async (req, res) => {
  sendResponse(res, 200, true, 'Probe run retrieved', await getProbe(req.params.id));
};
export const getLatestProbeController: RequestHandler = async (req, res) => {
  const query = req.query as unknown as { anchorId: string };
  sendResponse(res, 200, true, 'Latest probe retrieved', await getLatestProbe(query.anchorId));
};

export const listAttestationsController: RequestHandler = async (req, res) => {
  sendPage(
    res,
    'Attestations retrieved',
    await listAttestations(req.query as unknown as AttestationListQuery)
  );
};
export const createAttestationController: RequestHandler = async (req, res) => {
  sendResponse(res, 201, true, 'Attestation recorded', await createAttestation(req.body));
};
export const getAttestationController: RequestHandler = async (req, res) => {
  sendResponse(res, 200, true, 'Attestation retrieved', await getAttestation(req.params.id));
};
export const getLatestAttestationsController: RequestHandler = async (req, res) => {
  sendResponse(
    res,
    200,
    true,
    'Latest attestation retrieved',
    await getLatestAttestations(req.query as unknown as Pick<AttestationListQuery, 'anchorId' | 'corridorId'>)
  );
};
export const getAnchorAttestationsController: RequestHandler = async (req, res) => {
  sendPage(
    res,
    'Anchor attestations retrieved',
    await getAttestationHistory(
      { anchorId: req.params.anchorId },
      req.query as unknown as Pick<AttestationListQuery, 'page' | 'limit'>
    )
  );
};
export const getCorridorAttestationsController: RequestHandler = async (req, res) => {
  sendPage(
    res,
    'Corridor attestations retrieved',
    await getAttestationHistory(
      { corridorId: req.params.corridorId },
      req.query as unknown as Pick<AttestationListQuery, 'page' | 'limit'>
    )
  );
};