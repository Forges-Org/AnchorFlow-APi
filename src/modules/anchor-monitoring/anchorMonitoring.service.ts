import { Types } from 'mongoose';
import { AppError } from '../../shared/http/errors.js';
import {
  Anchor,
  Attestation,
  Corridor,
  FeeSnapshot,
  HealthObservation,
  ProbeRun,
  RouteDecision,
} from './anchorMonitoring.model.js';
import type {
  AnchorListQuery,
  AttestationListQuery,
  CorridorListQuery,
  FeeListQuery,
  HealthQuery,
  ProbeListQuery,
  RouteListQuery,
} from './anchorMonitoring.validation.js';

async function paginated<T>(
  recordsQuery: Promise<T[]>,
  countQuery: Promise<number>,
  page: number,
  limit: number
) {
  const [records, total] = await Promise.all([recordsQuery, countQuery]);
  return {
    data: records,
    meta: { page, limit, total, hasMore: page * limit < total },
  };
}

async function requireAnchor(anchorId: string) {
  const anchor = await Anchor.findById(anchorId).lean().exec();
  if (!anchor) throw new AppError(404, 'Anchor not found', 'ERR_ANCHOR_NOT_FOUND');
  return anchor;
}

async function requireCorridor(corridorId: string) {
  const corridor = await Corridor.findById(corridorId).lean().exec();
  if (!corridor) throw new AppError(404, 'Corridor not found', 'ERR_CORRIDOR_NOT_FOUND');
  return corridor;
}

export async function listAnchors(query: AnchorListQuery) {
  const { page, limit, ...filters } = query;
  const filter = {
    ...(filters.enabled === undefined ? {} : { enabled: filters.enabled }),
    ...(filters.countryCode ? { countryCodes: filters.countryCode.toUpperCase() } : {}),
    ...(filters.assetCode ? { assets: filters.assetCode.toUpperCase() } : {}),
  };
  return paginated(
    Anchor.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
    Anchor.countDocuments(filter).exec(),
    page,
    limit
  );
}

export async function createAnchor(input: Record<string, unknown>) {
  return Anchor.create(input);
}

export async function getAnchor(anchorId: string) {
  return requireAnchor(anchorId);
}

export async function updateAnchor(anchorId: string, input: Record<string, unknown>) {
  const anchor = await Anchor.findOneAndUpdate(
    { _id: anchorId, deletedAt: null },
    { $set: input },
    { new: true, runValidators: true }
  )
    .lean()
    .exec();
  if (!anchor) throw new AppError(404, 'Anchor not found', 'ERR_ANCHOR_NOT_FOUND');
  return anchor;
}

export async function deleteAnchor(anchorId: string) {
  const anchor = await Anchor.findOneAndUpdate(
    { _id: anchorId, deletedAt: null },
    { $set: { deletedAt: new Date(), enabled: false } },
    { new: true }
  )
    .lean()
    .exec();
  if (!anchor) throw new AppError(404, 'Anchor not found', 'ERR_ANCHOR_NOT_FOUND');
  return anchor;
}

export async function listCorridors(query: CorridorListQuery) {
  const { page, limit, ...filters } = query;
  const filter = {
    ...(filters.enabled === undefined ? {} : { enabled: filters.enabled }),
    ...(filters.assetCode ? { assetCode: filters.assetCode.toUpperCase() } : {}),
    ...(filters.countryCode ? { countryCode: filters.countryCode.toUpperCase() } : {}),
  };
  return paginated(
    Corridor.find(filter)
      .sort({ countryCode: 1, assetCode: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec(),
    Corridor.countDocuments(filter).exec(),
    page,
    limit
  );
}

export async function createCorridor(input: {
  anchorIds: string[];
  assetCode: string;
  assetIssuer: string;
  countryCode: string;
  enabled: boolean;
}) {
  const anchorIds = input.anchorIds.map((id) => new Types.ObjectId(id));
  const anchorCount = await Anchor.countDocuments({ _id: { $in: anchorIds }, enabled: true }).exec();
  if (anchorCount !== anchorIds.length) {
    throw new AppError(400, 'Every corridor anchor must exist and be enabled', 'ERR_CORRIDOR_INVALID_ANCHORS');
  }
  return Corridor.create({ ...input, assetCode: input.assetCode.toUpperCase(), anchorIds });
}

export async function getCorridor(corridorId: string) {
  return requireCorridor(corridorId);
}

export async function updateCorridor(
  corridorId: string,
  input: Partial<{ anchorIds: string[]; assetCode: string; assetIssuer: string; countryCode: string; enabled: boolean }>
) {
  const updates: Record<string, unknown> = { ...input };
  if (input.anchorIds) {
    const anchorIds = input.anchorIds.map((id) => new Types.ObjectId(id));
    const anchorCount = await Anchor.countDocuments({ _id: { $in: anchorIds }, enabled: true }).exec();
    if (anchorCount !== anchorIds.length) {
      throw new AppError(400, 'Every corridor anchor must exist and be enabled', 'ERR_CORRIDOR_INVALID_ANCHORS');
    }
    updates.anchorIds = anchorIds;
  }
  if (input.assetCode) updates.assetCode = input.assetCode.toUpperCase();
  if (input.countryCode) updates.countryCode = input.countryCode.toUpperCase();
  const corridor = await Corridor.findOneAndUpdate(
    { _id: corridorId, deletedAt: null },
    { $set: updates },
    { new: true, runValidators: true }
  )
    .lean()
    .exec();
  if (!corridor) throw new AppError(404, 'Corridor not found', 'ERR_CORRIDOR_NOT_FOUND');
  return corridor;
}

export async function deleteCorridor(corridorId: string) {
  const corridor = await Corridor.findOneAndUpdate(
    { _id: corridorId, deletedAt: null },
    { $set: { deletedAt: new Date(), enabled: false } },
    { new: true }
  )
    .lean()
    .exec();
  if (!corridor) throw new AppError(404, 'Corridor not found', 'ERR_CORRIDOR_NOT_FOUND');
  return corridor;
}

export async function listCorridorAnchors(corridorId: string) {
  const corridor = await requireCorridor(corridorId);
  return Anchor.find({ _id: { $in: corridor.anchorIds }, enabled: true }).sort({ name: 1 }).lean().exec();
}

export async function getCorridorHealth(corridorId: string, query: Pick<HealthQuery, 'page' | 'limit'>) {
  await requireCorridor(corridorId);
  const filter = { corridorId: new Types.ObjectId(corridorId) };
  return paginated(
    HealthObservation.find(filter)
      .sort({ observedAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean()
      .exec(),
    HealthObservation.countDocuments(filter).exec(),
    query.page,
    query.limit
  );
}

export async function getAnchorHealth(anchorId: string, query: HealthQuery) {
  await requireAnchor(anchorId);
  return getHealthHistory({ ...query, anchorId });
}

export async function recordHealth(input: Record<string, unknown> & { anchorId: string; corridorId?: string }) {
  await requireAnchor(input.anchorId);
  if (input.corridorId) {
    const corridor = await requireCorridor(input.corridorId);
    if (!corridor.anchorIds.some((id) => id.toString() === input.anchorId)) {
      throw new AppError(400, 'Anchor is not part of the specified corridor', 'ERR_HEALTH_CORRIDOR_MISMATCH');
    }
  }
  return HealthObservation.create({
    ...input,
    anchorId: new Types.ObjectId(input.anchorId),
    ...(input.corridorId ? { corridorId: new Types.ObjectId(input.corridorId) } : {}),
  });
}

export async function getLatestHealth(query: Pick<HealthQuery, 'anchorId' | 'corridorId'>) {
  if (query.anchorId) {
    await requireAnchor(query.anchorId);
    return HealthObservation.findOne({ anchorId: query.anchorId }).sort({ observedAt: -1 }).lean().exec();
  }
  if (!query.corridorId) throw new AppError(400, 'anchorId or corridorId is required', 'ERR_BAD_REQUEST');
  const corridor = await requireCorridor(query.corridorId);
  const observations = await Promise.all(
    corridor.anchorIds.map((anchorId) =>
      HealthObservation.findOne({ anchorId, corridorId: corridor._id }).sort({ observedAt: -1 }).lean().exec()
    )
  );
  return observations.filter((observation) => observation !== null);
}

export async function getHealthHistory(query: HealthQuery) {
  const { page, limit, anchorId, corridorId, from, to } = query;
  if (!anchorId && !corridorId) throw new AppError(400, 'anchorId or corridorId is required', 'ERR_BAD_REQUEST');
  if (anchorId) await requireAnchor(anchorId);
  if (corridorId) await requireCorridor(corridorId);
  const filter = {
    ...(anchorId ? { anchorId: new Types.ObjectId(anchorId) } : {}),
    ...(corridorId ? { corridorId: new Types.ObjectId(corridorId) } : {}),
    ...(from || to ? { observedAt: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } } : {}),
  };
  return paginated(
    HealthObservation.find(filter)
      .sort({ observedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec(),
    HealthObservation.countDocuments(filter).exec(),
    page,
    limit
  );
}

export async function compareHealth(anchorIds: string[]) {
  const anchors = await Anchor.find({ _id: { $in: anchorIds } }).select('_id name slug').lean().exec();
  const latest = await Promise.all(
    anchors.map(async (anchor) => ({
      anchor,
      observation: await HealthObservation.findOne({ anchorId: anchor._id })
        .sort({ observedAt: -1 })
        .lean()
        .exec(),
    }))
  );
  return latest;
}

export async function listFees(query: FeeListQuery) {
  const { page, limit, ...filters } = query;
  const filter = {
    ...(filters.anchorId ? { anchorId: new Types.ObjectId(filters.anchorId) } : {}),
    ...(filters.corridorId ? { corridorId: new Types.ObjectId(filters.corridorId) } : {}),
    ...(filters.assetCode ? { assetCode: filters.assetCode.toUpperCase() } : {}),
    ...(filters.countryCode ? { countryCode: filters.countryCode.toUpperCase() } : {}),
  };
  return paginated(
    FeeSnapshot.find(filter).sort({ recordedAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
    FeeSnapshot.countDocuments(filter).exec(),
    page,
    limit
  );
}

export async function createFee(input: {
  anchorId: string;
  corridorId?: string;
  assetCode: string;
  countryCode: string;
  minAmount: number;
  maxAmount: number;
  fixedFee: number;
  feePercent: number;
  recordedAt: Date;
}) {
  await requireAnchor(input.anchorId);
  if (input.corridorId) await requireCorridor(input.corridorId);
  return FeeSnapshot.create({
    ...input,
    anchorId: new Types.ObjectId(input.anchorId),
    ...(input.corridorId ? { corridorId: new Types.ObjectId(input.corridorId) } : {}),
    assetCode: input.assetCode.toUpperCase(),
    countryCode: input.countryCode.toUpperCase(),
  });
}

export async function getFee(feeId: string) {
  const fee = await FeeSnapshot.findById(feeId).lean().exec();
  if (!fee) throw new AppError(404, 'Fee snapshot not found', 'ERR_FEE_NOT_FOUND');
  return fee;
}

export async function compareFees(query: { assetCode: string; countryCode: string; amount: number }) {
  const snapshots = await FeeSnapshot.find({
    assetCode: query.assetCode.toUpperCase(),
    countryCode: query.countryCode.toUpperCase(),
    minAmount: { $lte: query.amount },
    maxAmount: { $gte: query.amount },
  })
    .sort({ recordedAt: -1 })
    .lean()
    .exec();
  const latestByAnchor = new Map<string, (typeof snapshots)[number]>();
  for (const snapshot of snapshots) {
    const key = snapshot.anchorId.toString();
    if (!latestByAnchor.has(key)) latestByAnchor.set(key, snapshot);
  }
  return [...latestByAnchor.values()]
    .map((snapshot) => ({
      ...snapshot,
      estimatedFee: snapshot.fixedFee + (query.amount * snapshot.feePercent) / 100,
    }))
    .sort((left, right) => left.estimatedFee - right.estimatedFee);
}

export async function getFeeHistory(query: FeeListQuery) {
  return listFees(query);
}

export async function getAnchorFees(anchorId: string, query: FeeListQuery) {
  await requireAnchor(anchorId);
  return listFees({ ...query, anchorId });
}

export async function getCorridorFees(corridorId: string, query: Pick<FeeListQuery, 'page' | 'limit'>) {
  await requireCorridor(corridorId);
  const filter = { corridorId: new Types.ObjectId(corridorId) };
  return paginated(
    FeeSnapshot.find(filter).sort({ recordedAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean().exec(),
    FeeSnapshot.countDocuments(filter).exec(),
    query.page,
    query.limit
  );
}

async function getRankedRoutes(input: { assetCode: string; countryCode: string; amount: number }) {
  const corridor = await Corridor.findOne({
    assetCode: input.assetCode.toUpperCase(),
    countryCode: input.countryCode.toUpperCase(),
    enabled: true,
  })
    .lean()
    .exec();
  if (!corridor) throw new AppError(404, 'No matching corridor found', 'ERR_ROUTE_NOT_FOUND');

  const anchors = await Anchor.find({ _id: { $in: corridor.anchorIds }, enabled: true }).lean().exec();
  const candidates = await Promise.all(
    anchors.map(async (anchor) => {
      const [health, fee] = await Promise.all([
        HealthObservation.findOne({ anchorId: anchor._id, corridorId: corridor._id })
          .sort({ observedAt: -1 })
          .lean()
          .exec(),
        FeeSnapshot.findOne({
          anchorId: anchor._id,
          corridorId: corridor._id,
          assetCode: input.assetCode.toUpperCase(),
          countryCode: input.countryCode.toUpperCase(),
          minAmount: { $lte: input.amount },
          maxAmount: { $gte: input.amount },
        })
          .sort({ recordedAt: -1 })
          .lean()
          .exec(),
      ]);
      if (!health || !fee || health.status === 'down') return null;
      return {
        anchor,
        health,
        fee,
        estimatedFee: fee.fixedFee + (input.amount * fee.feePercent) / 100,
      };
    })
  );
  const ranked = candidates
    .filter((candidate) => candidate !== null)
    .sort(
      (left, right) =>
        left.estimatedFee - right.estimatedFee ||
        right.health.healthScore - left.health.healthScore ||
        left.health.latencyMs - right.health.latencyMs
    );
  if (ranked.length === 0) {
    throw new AppError(404, 'No anchor has current health and fee data for this route', 'ERR_ROUTE_UNAVAILABLE');
  }
  return ranked;
}

export async function quoteRoute(input: { assetCode: string; countryCode: string; amount: number }) {
  const [best] = await getRankedRoutes(input);
  return best;
}

export async function getRouteAlternatives(input: { assetCode: string; countryCode: string; amount: number }) {
  return getRankedRoutes(input);
}

export async function createRouteDecision(input: { assetCode: string; countryCode: string; amount: number }) {
  const ranked = await getRankedRoutes(input);
  const [best] = ranked;
  const decision = await RouteDecision.create({
    ...input,
    assetCode: input.assetCode.toUpperCase(),
    countryCode: input.countryCode.toUpperCase(),
    selectedAnchorId: best.anchor._id,
    candidateAnchorIds: ranked.map((candidate) => candidate.anchor._id),
  });
  return { decision, selected: best, alternatives: ranked.slice(1) };
}

export async function listRouteDecisions(query: RouteListQuery) {
  const { page, limit, ...filters } = query;
  const filter = {
    ...(filters.assetCode ? { assetCode: filters.assetCode.toUpperCase() } : {}),
    ...(filters.countryCode ? { countryCode: filters.countryCode.toUpperCase() } : {}),
  };
  return paginated(
    RouteDecision.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
    RouteDecision.countDocuments(filter).exec(),
    page,
    limit
  );
}

export async function getRouteDecision(routeId: string) {
  const route = await RouteDecision.findById(routeId).lean().exec();
  if (!route) throw new AppError(404, 'Route decision not found', 'ERR_ROUTE_NOT_FOUND');
  return route;
}

export async function listProbes(query: ProbeListQuery) {
  const { page, limit, ...filters } = query;
  const filter = {
    ...(filters.anchorId ? { anchorId: new Types.ObjectId(filters.anchorId) } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };
  return paginated(
    ProbeRun.find(filter).sort({ checkedAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
    ProbeRun.countDocuments(filter).exec(),
    page,
    limit
  );
}

export async function recordProbe(input: {
  anchorId: string;
  checkedAt: Date;
  status: 'succeeded' | 'failed';
  latencyMs?: number;
  errorMessage?: string;
}) {
  await requireAnchor(input.anchorId);
  return ProbeRun.create({ ...input, anchorId: new Types.ObjectId(input.anchorId) });
}

export async function getProbe(probeId: string) {
  const probe = await ProbeRun.findById(probeId).lean().exec();
  if (!probe) throw new AppError(404, 'Probe run not found', 'ERR_PROBE_NOT_FOUND');
  return probe;
}

export async function getLatestProbe(anchorId: string) {
  await requireAnchor(anchorId);
  return ProbeRun.findOne({ anchorId }).sort({ checkedAt: -1 }).lean().exec();
}

export async function getProbeHistory(anchorId: string, query: ProbeListQuery) {
  await requireAnchor(anchorId);
  return listProbes({ ...query, anchorId });
}

export async function listAttestations(query: AttestationListQuery) {
  const { page, limit, ...filters } = query;
  const filter = {
    ...(filters.anchorId ? { anchorId: new Types.ObjectId(filters.anchorId) } : {}),
    ...(filters.corridorId ? { corridorId: new Types.ObjectId(filters.corridorId) } : {}),
    ...(filters.network ? { network: filters.network } : {}),
  };
  return paginated(
    Attestation.find(filter).sort({ observedAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
    Attestation.countDocuments(filter).exec(),
    page,
    limit
  );
}

export async function createAttestation(input: {
  anchorId: string;
  corridorId?: string;
  healthScore: number;
  observedAt: Date;
  network: 'testnet' | 'mainnet';
  transactionHash?: string;
}) {
  await requireAnchor(input.anchorId);
  if (input.corridorId) await requireCorridor(input.corridorId);
  return Attestation.create({
    ...input,
    anchorId: new Types.ObjectId(input.anchorId),
    ...(input.corridorId ? { corridorId: new Types.ObjectId(input.corridorId) } : {}),
  });
}

export async function getAttestation(attestationId: string) {
  const attestation = await Attestation.findById(attestationId).lean().exec();
  if (!attestation) throw new AppError(404, 'Attestation not found', 'ERR_ATTESTATION_NOT_FOUND');
  return attestation;
}

export async function getLatestAttestations(query: Pick<AttestationListQuery, 'anchorId' | 'corridorId'>) {
  if (query.anchorId) {
    await requireAnchor(query.anchorId);
    return Attestation.find({ anchorId: query.anchorId }).sort({ observedAt: -1 }).limit(1).lean().exec();
  }
  if (!query.corridorId) throw new AppError(400, 'anchorId or corridorId is required', 'ERR_BAD_REQUEST');
  await requireCorridor(query.corridorId);
  return Attestation.find({ corridorId: query.corridorId }).sort({ observedAt: -1 }).limit(1).lean().exec();
}

export async function getAttestationHistory(
  filter: Pick<AttestationListQuery, 'anchorId' | 'corridorId'>,
  query: Pick<AttestationListQuery, 'page' | 'limit'>
) {
  if (filter.anchorId) await requireAnchor(filter.anchorId);
  if (filter.corridorId) await requireCorridor(filter.corridorId);
  const mongoFilter = {
    ...(filter.anchorId ? { anchorId: new Types.ObjectId(filter.anchorId) } : {}),
    ...(filter.corridorId ? { corridorId: new Types.ObjectId(filter.corridorId) } : {}),
  };
  return paginated(
    Attestation.find(mongoFilter)
      .sort({ observedAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean()
      .exec(),
    Attestation.countDocuments(mongoFilter).exec(),
    query.page,
    query.limit
  );
}