import { MemoryRecordKind, SemanticMatch, SemanticQuery } from '../memory/types';

export type InteractionMode = 'yolo' | 'collaborative';

export type RecommendationType =
  | 'enhance_existing'
  | 'create_pax_skill'
  | 'create_project_skill'
  | 'update_aspect'
  | 'update_agents';

export interface SkillOverlapEvidence {
  skillId: string;
  overlap: number;
}

export interface RecommendationMemoryQuery {
  embedding: number[];
  kind?: MemoryRecordKind;
  topK?: number;
  similarityThreshold?: number;
}

export interface TelemetryEvidence {
  tokenCount?: number;
  contextTokens?: number;
  contextWindowTokens?: number;
  requestCount?: number;
  elapsedTimeMs?: number;
  qualityScore?: number;
  tokenDeltaPct?: number;
  contextDeltaPct?: number;
  requestDeltaPct?: number;
  elapsedTimeDeltaPct?: number;
  qualityLiftPct?: number;
}

export interface CanonicalMetricSnapshot {
  channel: string;
  modelCohort: string;
  tokenCount: number;
  contextTokens: number;
  contextWindowTokens: number;
  requestCount: number;
  elapsedTimeMs: number;
  qualityScore: number;
  capturedAt: string;
}

export interface CanonicalMetricRecord extends CanonicalMetricSnapshot {
  contextOverheadTokens: number;
  tokenEfficiency: number;
  requestEfficiency: number;
  elapsedTimePerRequestMs: number;
}

export interface RoiForecast {
  roi: number;
  frequency: number;
  projectedMinutesSaved: number;
  timeSavedMinutes: number;
  creationCostMinutes: number;
}

export interface RoiRealized {
  proposalId: string;
  roi: number;
  projectedMinutesSaved: number;
  timeSavedMinutes: number;
  requestSavings: number;
  tokenSavings: number;
  creationCostMinutes: number;
  capturedAt: string;
}

export interface RecommendationEfficiencyEvidence {
  canonical: CanonicalMetricRecord;
  forecast: RoiForecast;
  realized: RoiRealized;
  highRoi: boolean;
}

export interface ProgressiveDisclosureTiers {
  summary: string;
  detail: string[];
  evidence: string[];
}

export interface RecommendationInput {
  patternId: string;
  useCase: string;
  occurrences: number;
  channels: string[];
  modelCohorts: string[];
  workspaceSpecific: boolean;
  interactionMode: InteractionMode;
  affectsAgentRouting?: boolean;
  affectsAspectBehavior?: boolean;
  estimatedTimeSavedMinutes?: number;
  estimatedCreationCostMinutes?: number;
  evidenceIds?: string[];
  skillOverlaps?: SkillOverlapEvidence[];
  memoryQuery?: RecommendationMemoryQuery;
  telemetryEvidence?: TelemetryEvidence;
}

export interface RoutingDecision {
  type: RecommendationType;
  reason: string;
  targetSkillId?: string;
}

export interface ConfidenceBreakdown {
  patternStrength: number;
  channelCoverage: number;
  modelCoverage: number;
  efficiencySignal: number;
  overlapSignal: number;
}

export interface ConfidenceScore {
  value: number;
  breakdown: ConfidenceBreakdown;
}

export interface SkillCatalogEntry {
  id: string;
  summary: string;
  tags?: string[];
}

export interface SkillCatalogMatch {
  skillId: string;
  score: number;
  summary: string;
}

export interface MemorySearchPort {
  semanticSearch(query: SemanticQuery): Promise<SemanticMatch[]>;
}

export interface MemorySimilarityEvidence {
  recordId: string;
  score: number;
  summary: string;
}

export interface RecommendationResult {
  routing: RoutingDecision;
  confidence: ConfidenceScore;
  summary: {
    recommendationType: RecommendationType;
    confidence: number;
    roiForecast: number;
    highRoi: boolean;
    useCase: string;
    interactionMode: InteractionMode;
    requiresUserInput: boolean;
  };
  detail: {
    rationale: string[];
    proposedChanges: string[];
    nextSteps: string[];
    userPrompt?: string;
    disclosure: ProgressiveDisclosureTiers;
  };
  evidence: {
    patternId: string;
    occurrences: number;
    channels: string[];
    modelCohorts: string[];
    episodeIds: string[];
    memoryMatches: MemorySimilarityEvidence[];
    skillMatches: SkillCatalogMatch[];
    telemetry: TelemetryEvidence | null;
    efficiency: RecommendationEfficiencyEvidence;
  };
  delegation: {
    executor: 'skill-creator';
    executionPolicy: 'delegation_only';
    recommendationType: RecommendationType;
    targetSkillId?: string;
    payload: {
      useCase: string;
      patternId: string;
      evidenceIds: string[];
    };
  };
}

export interface RecommendationEngineContext {
  memory?: MemorySearchPort;
  skillCatalog?: SkillCatalogEntry[];
  channelCoverageTarget?: number;
  modelCoverageTarget?: number;
}
