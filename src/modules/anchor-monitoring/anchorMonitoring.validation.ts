import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Expected a MongoDB ObjectId');
const pageFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const anchorIdParamsSchema = z.object({ anchorId: objectId }).strict();
export const corridorIdParamsSchema = z.object({ corridorId: objectId }).strict();
export const idParamsSchema = z.object({ id: objectId }).strict();

export const anchorListQuerySchema = z.object({
  ...pageFields,
  countryCode: z.string().length(2).optional(),
  assetCode: z.string().trim().min(1).optional(),
  enabled: z.coerce.boolean().optional(),
}).strict();

export const createAnchorBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,80}$/i),
  homeDomain: z.string().trim().min(1).max(253),
  countryCodes: z.array(z.string().length(2)).default([]),
  assets: z.array(z.string().trim().min(1)).default([]),
  protocols: z.array(z.string().trim().min(1)).default([]),
  enabled: z.boolean().default(true),
}).strict();

export const updateAnchorBodySchema = createAnchorBodySchema.partial().strict();

export const corridorListQuerySchema = z.object({
  ...pageFields,
  assetCode: z.string().trim().min(1).optional(),
  countryCode: z.string().length(2).optional(),
  enabled: z.coerce.boolean().optional(),
}).strict();

export const createCorridorBodySchema = z.object({
  assetCode: z.string().trim().min(1).max(12),
  assetIssuer: z.string().trim().default(''),
  countryCode: z.string().length(2),
  anchorIds: z.array(objectId).min(1),
  enabled: z.boolean().default(true),
}).strict();

export const updateCorridorBodySchema = createCorridorBodySchema.partial().strict();

export const recordHealthBodySchema = z.object({
  anchorId: objectId,
  corridorId: objectId.optional(),
  observedAt: z.coerce.date(),
  status: z.enum(['operational', 'degraded', 'down']),
  healthScore: z.number().min(0).max(100),
  latencyMs: z.number().min(0),
  errorRate: z.number().min(0).max(1),
  uptime: z.number().min(0).max(100),
}).strict();

export const healthQuerySchema = z.object({
  ...pageFields,
  anchorId: objectId.optional(),
  corridorId: objectId.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: '`from` must be earlier than or equal to `to`',
});

export const latestHealthQuerySchema = healthQuerySchema.refine(
  (value) => Boolean(value.anchorId || value.corridorId),
  { message: 'anchorId or corridorId is required' }
);

export const compareHealthQuerySchema = z.object({
  anchorIds: z.string().transform((value) => value.split(',')).pipe(z.array(objectId).min(2).max(10)),
}).strict();

export const feeListQuerySchema = z.object({
  ...pageFields,
  anchorId: objectId.optional(),
  corridorId: objectId.optional(),
  assetCode: z.string().trim().min(1).optional(),
  countryCode: z.string().length(2).optional(),
}).strict();

export const createFeeBodySchema = z.object({
  anchorId: objectId,
  corridorId: objectId.optional(),
  assetCode: z.string().trim().min(1).max(12),
  countryCode: z.string().length(2),
  minAmount: z.number().min(0),
  maxAmount: z.number().min(0),
  fixedFee: z.number().min(0).default(0),
  feePercent: z.number().min(0).max(100).default(0),
  recordedAt: z.coerce.date(),
}).strict().refine((value) => value.minAmount <= value.maxAmount, {
  message: '`minAmount` must be less than or equal to `maxAmount`',
});

export const compareFeesQuerySchema = z.object({
  assetCode: z.string().trim().min(1),
  countryCode: z.string().length(2),
  amount: z.coerce.number().positive(),
}).strict();

export const routeBodySchema = z.object({
  assetCode: z.string().trim().min(1).max(12),
  countryCode: z.string().length(2),
  amount: z.number().positive(),
}).strict();

export const routeListQuerySchema = z.object({
  ...pageFields,
  assetCode: z.string().trim().min(1).optional(),
  countryCode: z.string().length(2).optional(),
}).strict();

export const probeListQuerySchema = z.object({
  ...pageFields,
  anchorId: objectId.optional(),
  status: z.enum(['succeeded', 'failed']).optional(),
}).strict();

export const latestProbeQuerySchema = z.object({ anchorId: objectId }).strict();

export const recordProbeBodySchema = z.object({
  anchorId: objectId,
  checkedAt: z.coerce.date(),
  status: z.enum(['succeeded', 'failed']),
  latencyMs: z.number().min(0).optional(),
  errorMessage: z.string().trim().max(500).optional(),
}).strict().refine(
  (value) => value.status !== 'succeeded' || value.latencyMs !== undefined,
  { message: 'A successful probe must include latencyMs' },
);

export const attestationListQuerySchema = z.object({
  ...pageFields,
  anchorId: objectId.optional(),
  corridorId: objectId.optional(),
  network: z.enum(['testnet', 'mainnet']).optional(),
}).strict();

export const latestAttestationQuerySchema = attestationListQuerySchema.refine(
  (value) => Boolean(value.anchorId || value.corridorId),
  { message: 'anchorId or corridorId is required' }
);

export const createAttestationBodySchema = z.object({
  anchorId: objectId,
  corridorId: objectId.optional(),
  healthScore: z.number().min(0).max(100),
  observedAt: z.coerce.date(),
  network: z.enum(['testnet', 'mainnet']),
  transactionHash: z.string().trim().min(1).max(128).optional(),
}).strict();

export type AnchorListQuery = z.infer<typeof anchorListQuerySchema>;
export type CorridorListQuery = z.infer<typeof corridorListQuerySchema>;
export type HealthQuery = z.infer<typeof healthQuerySchema>;
export type FeeListQuery = z.infer<typeof feeListQuerySchema>;
export type RouteListQuery = z.infer<typeof routeListQuerySchema>;
export type ProbeListQuery = z.infer<typeof probeListQuerySchema>;
export type AttestationListQuery = z.infer<typeof attestationListQuerySchema>;