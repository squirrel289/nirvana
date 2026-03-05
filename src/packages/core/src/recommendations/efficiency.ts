import {
  CanonicalMetricRecord,
  CanonicalMetricSnapshot,
  ProgressiveDisclosureTiers,
  RecommendationEfficiencyEvidence,
  RecommendationInput,
  RecommendationResult,
  RoiForecast,
  RoiRealized,
  TelemetryEvidence,
} from './types';

const DEFAULT_CONTEXT_WINDOW_TOKENS = 128_000;
const DEFAULT_HIGH_ROI_THRESHOLD = 1;
const DEFAULT_CREATION_COST_MINUTES = 180;

function clamp(value: number, minimum: number = 0, maximum: number = Number.POSITIVE_INFINITY): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return minimum;
  }

  if (value < minimum) {
    return minimum;
  }

  if (value > maximum) {
    return maximum;
  }

  return value;
}

function round(value: number, digits: number = 4): number {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function countApproxTokens(content: string): number {
  const normalized = content.trim();
  if (normalized.length === 0) {
    return 0;
  }

  return normalized.split(/\s+/).length;
}

function fitTokenBudget(content: string, tokenBudget: number): string {
  if (tokenBudget <= 0) {
    return '';
  }

  const tokens = content.trim().split(/\s+/);
  if (tokens.length <= tokenBudget) {
    return content.trim();
  }

  return `${tokens.slice(0, tokenBudget).join(' ')}...`;
}

function safeNumber(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number') {
    return fallback;
  }

  return clamp(value);
}

function deriveTimeSavedMinutes(input: RecommendationInput): number {
  if (typeof input.estimatedTimeSavedMinutes === 'number') {
    return clamp(input.estimatedTimeSavedMinutes);
  }

  return Math.max(10, input.occurrences * 3);
}

function deriveCreationCostMinutes(input: RecommendationInput): number {
  if (typeof input.estimatedCreationCostMinutes === 'number') {
    return clamp(input.estimatedCreationCostMinutes, 30);
  }

  let estimate = DEFAULT_CREATION_COST_MINUTES;

  if (input.workspaceSpecific) {
    estimate -= 30;
  }

  if (input.affectsAgentRouting) {
    estimate += 45;
  }

  if (input.affectsAspectBehavior) {
    estimate += 30;
  }

  estimate += Math.max(0, input.channels.length - 1) * 10;
  estimate += Math.max(0, input.modelCohorts.length - 1) * 8;

  if (input.skillOverlaps && input.skillOverlaps.length > 0) {
    estimate -= 20;
  }

  return clamp(estimate, 30);
}

function deriveQualityScore(telemetry: TelemetryEvidence | undefined): number {
  if (typeof telemetry?.qualityScore === 'number') {
    return clamp(telemetry.qualityScore, 0, 1);
  }

  const lift = clamp(telemetry?.qualityLiftPct ?? 0, -1, 1);
  return clamp(0.5 + lift * 0.5, 0, 1);
}

function toCanonicalRecord(snapshot: CanonicalMetricSnapshot): CanonicalMetricRecord {
  const contextOverheadTokens = clamp(snapshot.contextWindowTokens - snapshot.contextTokens);
  const tokenEfficiency =
    snapshot.tokenCount === 0 ? snapshot.qualityScore : snapshot.qualityScore / snapshot.tokenCount;
  const requestEfficiency =
    snapshot.requestCount === 0 ? snapshot.qualityScore : snapshot.qualityScore / snapshot.requestCount;
  const elapsedTimePerRequestMs =
    snapshot.requestCount === 0 ? snapshot.elapsedTimeMs : snapshot.elapsedTimeMs / snapshot.requestCount;

  return {
    ...snapshot,
    contextOverheadTokens,
    tokenEfficiency: round(tokenEfficiency, 6),
    requestEfficiency: round(requestEfficiency, 6),
    elapsedTimePerRequestMs: round(elapsedTimePerRequestMs, 2),
  };
}

export interface TelemetryEvalProviderAdapter {
  readonly name: string;
  collectMetrics(options?: {
    since?: string;
    until?: string;
    channels?: string[];
    modelCohorts?: string[];
  }): Promise<CanonicalMetricSnapshot[]>;
}

export interface RoiForecastInput {
  frequency: number;
  timeSavedMinutes: number;
  creationCostMinutes: number;
}

export interface RoiRealizedSample {
  proposalId: string;
  baselineTimeMinutes: number;
  currentTimeMinutes: number;
  baselineRequests: number;
  currentRequests: number;
  baselineTokens: number;
  currentTokens: number;
  creationCostMinutes: number;
  capturedAt?: string;
}

export class LocalFirstMetricCollector {
  private readonly records: CanonicalMetricRecord[] = [];

  record(snapshot: CanonicalMetricSnapshot): CanonicalMetricRecord {
    const record = toCanonicalRecord(snapshot);
    this.records.push(record);
    return record;
  }

  list(): CanonicalMetricRecord[] {
    return [...this.records];
  }

  summarize(filters?: { channel?: string; modelCohort?: string }): {
    totalRecords: number;
    averageElapsedMs: number;
    averageTokenCount: number;
    averageRequestCount: number;
    averageContextOverheadTokens: number;
    averageQualityScore: number;
  } {
    const filtered = this.records.filter((record) => {
      if (filters?.channel && record.channel !== filters.channel) {
        return false;
      }

      if (filters?.modelCohort && record.modelCohort !== filters.modelCohort) {
        return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      return {
        totalRecords: 0,
        averageElapsedMs: 0,
        averageTokenCount: 0,
        averageRequestCount: 0,
        averageContextOverheadTokens: 0,
        averageQualityScore: 0,
      };
    }

    const totalElapsed = filtered.reduce((sum, record) => sum + record.elapsedTimeMs, 0);
    const totalTokens = filtered.reduce((sum, record) => sum + record.tokenCount, 0);
    const totalRequests = filtered.reduce((sum, record) => sum + record.requestCount, 0);
    const totalContextOverhead = filtered.reduce(
      (sum, record) => sum + record.contextOverheadTokens,
      0
    );
    const totalQuality = filtered.reduce((sum, record) => sum + record.qualityScore, 0);

    return {
      totalRecords: filtered.length,
      averageElapsedMs: round(totalElapsed / filtered.length, 2),
      averageTokenCount: round(totalTokens / filtered.length, 2),
      averageRequestCount: round(totalRequests / filtered.length, 2),
      averageContextOverheadTokens: round(totalContextOverhead / filtered.length, 2),
      averageQualityScore: round(totalQuality / filtered.length, 4),
    };
  }
}

export class RoiTracker {
  private readonly realizedByProposal = new Map<string, RoiRealized[]>();

  forecast(input: RoiForecastInput): RoiForecast {
    const frequency = Math.max(1, Math.floor(input.frequency));
    const timeSavedMinutes = clamp(input.timeSavedMinutes);
    const creationCostMinutes = clamp(input.creationCostMinutes, 1);
    const projectedMinutesSaved = timeSavedMinutes * frequency;
    const roi = projectedMinutesSaved / creationCostMinutes;

    return {
      roi: round(roi),
      frequency,
      projectedMinutesSaved: round(projectedMinutesSaved, 2),
      timeSavedMinutes: round(timeSavedMinutes, 2),
      creationCostMinutes: round(creationCostMinutes, 2),
    };
  }

  recordRealized(sample: RoiRealizedSample): RoiRealized {
    const timeSavedMinutes = clamp(sample.baselineTimeMinutes - sample.currentTimeMinutes);
    const requestSavings = clamp(sample.baselineRequests - sample.currentRequests);
    const tokenSavings = clamp(sample.baselineTokens - sample.currentTokens);
    const projectedMinutesSaved = timeSavedMinutes + requestSavings * 2 + tokenSavings / 1000;
    const creationCostMinutes = clamp(sample.creationCostMinutes, 1);
    const roi = projectedMinutesSaved / creationCostMinutes;

    const record: RoiRealized = {
      proposalId: sample.proposalId,
      roi: round(roi),
      projectedMinutesSaved: round(projectedMinutesSaved, 2),
      timeSavedMinutes: round(timeSavedMinutes, 2),
      requestSavings: round(requestSavings, 2),
      tokenSavings: round(tokenSavings, 2),
      creationCostMinutes: round(creationCostMinutes, 2),
      capturedAt: sample.capturedAt ?? new Date().toISOString(),
    };

    const history = this.realizedByProposal.get(sample.proposalId) ?? [];
    history.push(record);
    this.realizedByProposal.set(sample.proposalId, history);

    return record;
  }

  latest(proposalId: string): RoiRealized | null {
    const history = this.realizedByProposal.get(proposalId);
    if (!history || history.length === 0) {
      return null;
    }

    return history[history.length - 1];
  }
}

export function buildRecommendationEfficiencyEvidence(
  input: RecommendationInput,
  options?: {
    now?: () => Date;
    collector?: LocalFirstMetricCollector;
    highRoiThreshold?: number;
  }
): RecommendationEfficiencyEvidence {
  const now = options?.now ?? (() => new Date());
  const collector = options?.collector ?? new LocalFirstMetricCollector();
  const telemetry = input.telemetryEvidence;
  const timeSavedMinutes = deriveTimeSavedMinutes(input);
  const creationCostMinutes = deriveCreationCostMinutes(input);

  const canonical = collector.record({
    channel: input.channels[0] ?? 'unknown',
    modelCohort: input.modelCohorts[0] ?? 'unknown',
    tokenCount: safeNumber(telemetry?.tokenCount, Math.max(100, input.occurrences * 120)),
    contextTokens: safeNumber(telemetry?.contextTokens, Math.max(400, input.occurrences * 80)),
    contextWindowTokens: safeNumber(
      telemetry?.contextWindowTokens,
      DEFAULT_CONTEXT_WINDOW_TOKENS
    ),
    requestCount: safeNumber(telemetry?.requestCount, Math.max(1, input.occurrences)),
    elapsedTimeMs: safeNumber(
      telemetry?.elapsedTimeMs,
      Math.max(1_000, timeSavedMinutes * 60_000)
    ),
    qualityScore: deriveQualityScore(telemetry),
    capturedAt: now().toISOString(),
  });

  const roiTracker = new RoiTracker();
  const forecast = roiTracker.forecast({
    frequency: input.occurrences,
    timeSavedMinutes,
    creationCostMinutes,
  });
  const realized: RoiRealized = {
    proposalId: 'untracked',
    roi: 0,
    projectedMinutesSaved: 0,
    timeSavedMinutes: 0,
    requestSavings: 0,
    tokenSavings: 0,
    creationCostMinutes: forecast.creationCostMinutes,
    capturedAt: now().toISOString(),
  };

  const highRoiThreshold = options?.highRoiThreshold ?? DEFAULT_HIGH_ROI_THRESHOLD;

  return {
    canonical,
    forecast,
    realized,
    highRoi: forecast.roi >= highRoiThreshold,
  };
}

export function buildProgressiveDisclosure(options: {
  recommendationType: string;
  confidence: number;
  roiForecast: number;
  highRoi: boolean;
  useCase: string;
  channels: string[];
  modelCohorts: string[];
  occurrences: number;
  episodeIds: string[];
  rationale: string[];
  maxSummaryTokens?: number;
}): ProgressiveDisclosureTiers {
  const maxSummaryTokens = Math.max(1, options.maxSummaryTokens ?? 100);

  const summaryBase =
    `Type ${options.recommendationType}. ` +
    `Confidence ${options.confidence.toFixed(2)}. ` +
    `Forecast ROI ${options.roiForecast.toFixed(2)} (${options.highRoi ? 'high-priority' : 'normal-priority'}). ` +
    `Pattern repeated ${options.occurrences} time(s). ` +
    `Use case: ${options.useCase}`;

  const summary = fitTokenBudget(summaryBase, maxSummaryTokens);

  return {
    summary,
    detail: [
      ...options.rationale.slice(0, 5),
      `Channels: ${options.channels.join(', ') || 'none'}`,
      `Model cohorts: ${options.modelCohorts.join(', ') || 'none'}`,
    ],
    evidence: [
      `Episode IDs (${options.episodeIds.length}): ${options.episodeIds.join(', ') || 'none'}`,
      `Summary token estimate: ${countApproxTokens(summary)}/${maxSummaryTokens}`,
    ],
  };
}

export function rankRecommendationsByRoi(
  recommendations: RecommendationResult[]
): RecommendationResult[] {
  return [...recommendations].sort((left, right) => {
    const leftRoi = left.evidence.efficiency.forecast.roi;
    const rightRoi = right.evidence.efficiency.forecast.roi;

    if (rightRoi !== leftRoi) {
      return rightRoi - leftRoi;
    }

    return right.summary.confidence - left.summary.confidence;
  });
}

export function estimateSummaryTokenCount(summary: string): number {
  return countApproxTokens(summary);
}
