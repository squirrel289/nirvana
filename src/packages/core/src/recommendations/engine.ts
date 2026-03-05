import { routeRecommendation } from './routing';
import { computeConfidenceScore } from './confidence';
import {
  buildProgressiveDisclosure,
  buildRecommendationEfficiencyEvidence,
} from './efficiency';
import {
  MemorySimilarityEvidence,
  RecommendationEngineContext,
  RecommendationInput,
  RecommendationResult,
  SkillCatalogEntry,
  SkillCatalogMatch,
} from './types';

const DEFAULT_SIMILARITY_THRESHOLD = 0.7;
const DEFAULT_TOP_K = 5;

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2)
  );
}

function jaccardSimilarity(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  let overlap = 0;

  for (const token of left) {
    if (right.has(token)) {
      overlap += 1;
    }
  }

  const unionSize = left.size + right.size - overlap;
  if (unionSize === 0) {
    return 0;
  }

  return overlap / unionSize;
}

function collectSkillMatches(
  input: RecommendationInput,
  skillCatalog: SkillCatalogEntry[]
): SkillCatalogMatch[] {
  const useCaseTokens = tokenize(input.useCase);

  return skillCatalog
    .map((entry) => {
      const searchText = [entry.id, entry.summary, ...(entry.tags ?? [])].join(' ');
      const score = jaccardSimilarity(useCaseTokens, tokenize(searchText));

      return {
        skillId: entry.id,
        score,
        summary: entry.summary,
      };
    })
    .filter((match) => match.score >= 0.1)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}

async function collectMemoryMatches(
  input: RecommendationInput,
  context: RecommendationEngineContext
): Promise<MemorySimilarityEvidence[]> {
  if (!context.memory || !input.memoryQuery) {
    return [];
  }

  const similarityThreshold =
    input.memoryQuery.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD;

  const matches = await context.memory.semanticSearch({
    embedding: input.memoryQuery.embedding,
    topK: input.memoryQuery.topK ?? DEFAULT_TOP_K,
    similarityThreshold,
    kind: input.memoryQuery.kind,
  });

  return matches
    .filter((match) => match.score >= similarityThreshold)
    .map((match) => ({
      recordId: match.record.id,
      score: match.score,
      summary: match.record.content.slice(0, 180),
    }));
}

function createProposedChanges(result: RecommendationResult): string[] {
  switch (result.routing.type) {
    case 'enhance_existing':
      return [
        `Extend existing skill ${result.routing.targetSkillId ?? 'unknown-skill'} with the detected pattern behavior.`,
        'Add regression tests for routing and confidence gates before promotion.',
      ];
    case 'create_project_skill':
      return [
        'Create a workspace-local skill that captures the repeated workflow pattern.',
        'Document local constraints and rollout guardrails in the new skill metadata.',
      ];
    case 'update_aspect':
      return [
        'Apply cross-cutting logic via an aspect update so multiple skills inherit the same behavior.',
      ];
    case 'update_agents':
      return [
        'Adjust AGENTS routing/delegation guidance to reduce repeated manual handling.',
      ];
    case 'create_pax_skill':
    default:
      return [
        'Create a reusable PAX skill with provider-agnostic interfaces and evidence-backed defaults.',
        'Attach rollout criteria and quality gates for cross-project adoption.',
      ];
  }
}

function createNextSteps(result: RecommendationResult): string[] {
  if (result.summary.interactionMode === 'collaborative') {
    return [
      'Review the recommendation summary and rationale with a human approver.',
      'Confirm or revise routing target before delegation.',
      'If approved, delegate to skill-creator with the payload below.',
    ];
  }

  return [
    'Recommendation generated automatically in YOLO mode.',
    'Delegate to skill-creator using the payload below when ready.',
    'Record acceptance outcome for signal-evolution feedback loops.',
  ];
}

function buildRationale(
  input: RecommendationInput,
  result: RecommendationResult,
  memoryMatches: MemorySimilarityEvidence[],
  skillMatches: SkillCatalogMatch[]
): string[] {
  const rationale = [
    `Detected pattern ${input.patternId} ${input.occurrences} times across ${input.channels.length} channel(s).`,
    `Routing decision: ${result.routing.type} (${result.routing.reason})`,
    `Confidence ${result.confidence.value.toFixed(2)} combines pattern strength (${result.confidence.breakdown.patternStrength.toFixed(2)}), channel coverage (${result.confidence.breakdown.channelCoverage.toFixed(2)}), and model coverage (${result.confidence.breakdown.modelCoverage.toFixed(2)}).`,
    `Forecast ROI ${result.evidence.efficiency.forecast.roi.toFixed(2)} from projected ${result.evidence.efficiency.forecast.projectedMinutesSaved.toFixed(1)} minute savings at creation cost ${result.evidence.efficiency.forecast.creationCostMinutes.toFixed(1)} minutes.`,
  ];

  if (memoryMatches.length > 0) {
    rationale.push(
      `Memory similarity search returned ${memoryMatches.length} match(es) at threshold ${input.memoryQuery?.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD}.`
    );
  }

  if (skillMatches.length > 0) {
    rationale.push(`Skill catalog search found ${skillMatches.length} related skill candidate(s).`);
  }

  if (input.telemetryEvidence) {
    rationale.push('Telemetry/eval evidence was included in this recommendation payload.');
  }

  return rationale;
}

export async function generateSkillRecommendation(
  input: RecommendationInput,
  context: RecommendationEngineContext = {}
): Promise<RecommendationResult> {
  const routing = routeRecommendation(input);
  const efficiency = buildRecommendationEfficiencyEvidence(input);
  const confidence = computeConfidenceScore(input, routing, {
    channelCoverageTarget: context.channelCoverageTarget,
    modelCoverageTarget: context.modelCoverageTarget,
    efficiencyForecastRoi: efficiency.forecast.roi,
  });

  const [memoryMatches, skillMatches] = await Promise.all([
    collectMemoryMatches(input, context),
    Promise.resolve(collectSkillMatches(input, context.skillCatalog ?? [])),
  ]);

  const requiresUserInput = input.interactionMode === 'collaborative';
  const episodeIds = [...(input.evidenceIds ?? []), ...memoryMatches.map((match) => match.recordId)];

  const result: RecommendationResult = {
    routing,
    confidence,
    summary: {
      recommendationType: routing.type,
      confidence: confidence.value,
      roiForecast: efficiency.forecast.roi,
      highRoi: efficiency.highRoi,
      useCase: input.useCase,
      interactionMode: input.interactionMode,
      requiresUserInput,
    },
    detail: {
      rationale: [],
      proposedChanges: [],
      nextSteps: [],
      userPrompt: requiresUserInput
        ? 'Collaborative mode: review recommendation details and approve delegation to skill-creator.'
        : undefined,
      disclosure: {
        summary: '',
        detail: [],
        evidence: [],
      },
    },
    evidence: {
      patternId: input.patternId,
      occurrences: input.occurrences,
      channels: input.channels,
      modelCohorts: input.modelCohorts,
      episodeIds,
      memoryMatches,
      skillMatches,
      telemetry: input.telemetryEvidence ?? null,
      efficiency,
    },
    delegation: {
      executor: 'skill-creator',
      executionPolicy: 'delegation_only',
      recommendationType: routing.type,
      targetSkillId: routing.targetSkillId,
      payload: {
        useCase: input.useCase,
        patternId: input.patternId,
        evidenceIds: episodeIds,
      },
    },
  };

  result.detail.rationale = buildRationale(input, result, memoryMatches, skillMatches);
  result.detail.proposedChanges = createProposedChanges(result);
  result.detail.nextSteps = createNextSteps(result);
  result.detail.disclosure = buildProgressiveDisclosure({
    recommendationType: result.summary.recommendationType,
    confidence: result.summary.confidence,
    roiForecast: result.summary.roiForecast,
    highRoi: result.summary.highRoi,
    useCase: result.summary.useCase,
    channels: result.evidence.channels,
    modelCohorts: result.evidence.modelCohorts,
    occurrences: result.evidence.occurrences,
    episodeIds: result.evidence.episodeIds,
    rationale: result.detail.rationale,
    maxSummaryTokens: 100,
  });

  return result;
}
