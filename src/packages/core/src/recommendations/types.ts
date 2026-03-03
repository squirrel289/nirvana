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
  tokenDeltaPct?: number;
  contextDeltaPct?: number;
  requestDeltaPct?: number;
  elapsedTimeDeltaPct?: number;
  qualityLiftPct?: number;
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
    useCase: string;
    interactionMode: InteractionMode;
    requiresUserInput: boolean;
  };
  detail: {
    rationale: string[];
    proposedChanges: string[];
    nextSteps: string[];
    userPrompt?: string;
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
