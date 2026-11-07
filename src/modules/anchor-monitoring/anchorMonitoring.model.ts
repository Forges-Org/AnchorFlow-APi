import { Schema, Types, model } from 'mongoose';
import { isoDatePlugin } from '../../shared/plugins/isoDatePlugin.js';

export type AnchorHealthStatus = 'operational' | 'degraded' | 'down';
export type ProbeStatus = 'succeeded' | 'failed';

interface AnchorRecord {
  name: string;
  slug: string;
  homeDomain: string;
  countryCodes: string[];
  assets: string[];
  protocols: string[];
  enabled: boolean;
  deletedAt: Date | null;
}

interface CorridorRecord {
  assetCode: string;
  assetIssuer: string;
  countryCode: string;
  anchorIds: Types.ObjectId[];
  enabled: boolean;
  deletedAt: Date | null;
}

interface HealthObservationRecord {
  anchorId: Types.ObjectId;
  corridorId?: Types.ObjectId;
  observedAt: Date;
  status: AnchorHealthStatus;
  healthScore: number;
  latencyMs: number;
  errorRate: number;
  uptime: number;
  deletedAt: Date | null;
}

interface FeeSnapshotRecord {
  anchorId: Types.ObjectId;
  corridorId?: Types.ObjectId;
  assetCode: string;
  countryCode: string;
  minAmount: number;
  maxAmount: number;
  fixedFee: number;
  feePercent: number;
  recordedAt: Date;
  deletedAt: Date | null;
}

interface RouteDecisionRecord {
  assetCode: string;
  countryCode: string;
  amount: number;
  selectedAnchorId: Types.ObjectId;
  candidateAnchorIds: Types.ObjectId[];
  createdAt: Date;
  deletedAt: Date | null;
}

interface ProbeRunRecord {
  anchorId: Types.ObjectId;
  checkedAt: Date;
  status: ProbeStatus;
  latencyMs?: number;
  errorMessage?: string;
  deletedAt: Date | null;
}

interface AttestationRecord {
  anchorId: Types.ObjectId;
  corridorId?: Types.ObjectId;
  healthScore: number;
  observedAt: Date;
  network: 'testnet' | 'mainnet';
  transactionHash?: string;
  deletedAt: Date | null;
}

const softDelete = (schema: Schema): void => {
  schema.pre(['find', 'findOne', 'countDocuments'], function () {
    this.where({ deletedAt: null });
  });
  schema.pre('aggregate', function () {
    this.pipeline().unshift({ $match: { deletedAt: null } });
  });
  schema.plugin(isoDatePlugin);
};

const AnchorSchema = new Schema<AnchorRecord>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    homeDomain: { type: String, required: true, trim: true, lowercase: true },
    countryCodes: { type: [String], required: true, default: [] },
    assets: { type: [String], required: true, default: [] },
    protocols: { type: [String], required: true, default: [] },
    enabled: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
AnchorSchema.index({ slug: 1 });
AnchorSchema.index({ countryCodes: 1, assets: 1, enabled: 1 });
softDelete(AnchorSchema);

const CorridorSchema = new Schema<CorridorRecord>(
  {
    assetCode: { type: String, required: true, trim: true, uppercase: true },
    assetIssuer: { type: String, default: '' },
    countryCode: { type: String, required: true, trim: true, uppercase: true },
    anchorIds: [{ type: Types.ObjectId, ref: 'Anchor', required: true }],
    enabled: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
CorridorSchema.index({ assetCode: 1, assetIssuer: 1, countryCode: 1, enabled: 1 });
softDelete(CorridorSchema);

const HealthObservationSchema = new Schema<HealthObservationRecord>(
  {
    anchorId: { type: Types.ObjectId, ref: 'Anchor', required: true },
    corridorId: { type: Types.ObjectId, ref: 'Corridor' },
    observedAt: { type: Date, required: true },
    status: { type: String, enum: ['operational', 'degraded', 'down'], required: true },
    healthScore: { type: Number, min: 0, max: 100, required: true },
    latencyMs: { type: Number, min: 0, required: true },
    errorRate: { type: Number, min: 0, max: 1, required: true },
    uptime: { type: Number, min: 0, max: 100, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
HealthObservationSchema.index({ anchorId: 1, observedAt: -1 });
HealthObservationSchema.index({ corridorId: 1, observedAt: -1 });
softDelete(HealthObservationSchema);

const FeeSnapshotSchema = new Schema<FeeSnapshotRecord>(
  {
    anchorId: { type: Types.ObjectId, ref: 'Anchor', required: true },
    corridorId: { type: Types.ObjectId, ref: 'Corridor' },
    assetCode: { type: String, required: true, trim: true, uppercase: true },
    countryCode: { type: String, required: true, trim: true, uppercase: true },
    minAmount: { type: Number, min: 0, required: true },
    maxAmount: { type: Number, min: 0, required: true },
    fixedFee: { type: Number, min: 0, default: 0 },
    feePercent: { type: Number, min: 0, max: 100, default: 0 },
    recordedAt: { type: Date, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
FeeSnapshotSchema.index({ anchorId: 1, recordedAt: -1 });
FeeSnapshotSchema.index({ assetCode: 1, countryCode: 1, recordedAt: -1 });
softDelete(FeeSnapshotSchema);

const RouteDecisionSchema = new Schema<RouteDecisionRecord>(
  {
    assetCode: { type: String, required: true, trim: true, uppercase: true },
    countryCode: { type: String, required: true, trim: true, uppercase: true },
    amount: { type: Number, min: 0, required: true },
    selectedAnchorId: { type: Types.ObjectId, ref: 'Anchor', required: true },
    candidateAnchorIds: [{ type: Types.ObjectId, ref: 'Anchor' }],
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
RouteDecisionSchema.index({ createdAt: -1 });
softDelete(RouteDecisionSchema);

const ProbeRunSchema = new Schema<ProbeRunRecord>(
  {
    anchorId: { type: Types.ObjectId, ref: 'Anchor', required: true },
    checkedAt: { type: Date, required: true },
    status: { type: String, enum: ['succeeded', 'failed'], required: true },
    latencyMs: { type: Number, min: 0 },
    errorMessage: { type: String, maxlength: 500 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
ProbeRunSchema.index({ anchorId: 1, checkedAt: -1 });
softDelete(ProbeRunSchema);

const AttestationSchema = new Schema<AttestationRecord>(
  {
    anchorId: { type: Types.ObjectId, ref: 'Anchor', required: true },
    corridorId: { type: Types.ObjectId, ref: 'Corridor' },
    healthScore: { type: Number, min: 0, max: 100, required: true },
    observedAt: { type: Date, required: true },
    network: { type: String, enum: ['testnet', 'mainnet'], required: true },
    transactionHash: { type: String, trim: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
AttestationSchema.index({ anchorId: 1, observedAt: -1 });
AttestationSchema.index({ corridorId: 1, observedAt: -1 });
softDelete(AttestationSchema);

export const Anchor = model<AnchorRecord>('Anchor', AnchorSchema);
export const Corridor = model<CorridorRecord>('Corridor', CorridorSchema);
export const HealthObservation = model<HealthObservationRecord>(
  'HealthObservation',
  HealthObservationSchema
);
export const FeeSnapshot = model<FeeSnapshotRecord>('FeeSnapshot', FeeSnapshotSchema);
export const RouteDecision = model<RouteDecisionRecord>('RouteDecision', RouteDecisionSchema);
export const ProbeRun = model<ProbeRunRecord>('ProbeRun', ProbeRunSchema);
export const Attestation = model<AttestationRecord>('Attestation', AttestationSchema);