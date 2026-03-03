import { RecommendationInput, RoutingDecision, ConfidenceScore } from './types';

function clamp(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

export function computeConfidenceScore(
  input: RecommendationInput,
  routing: RoutingDecision,
  options: {
    channelCoverageTarget?: number;
    modelCoverageTarget?: number;
  } = {}
): ConfidenceScore {
  const uniqueChannels = new Set(input.channels).size;
  const uniqueModelCohorts = new Set(input.modelCohorts).size;

  const channelCoverageTarget = Math.max(1, options.channelCoverageTarget ?? 3);
  const modelCoverageTarget = Math.max(1, options.modelCoverageTarget ?? 2);

  const patternStrength = clamp(input.occurrences / 5);
  const channelCoverage = clamp(uniqueChannels / channelCoverageTarget);
  const modelCoverage = clamp(uniqueModelCohorts / modelCoverageTarget);
  const efficiencySignal = clamp((input.estimatedTimeSavedMinutes ?? 0) / 60);

  const bestOverlap =
    input.skillOverlaps?.reduce((best, candidate) => {
      if (!best || candidate.overlap > best.overlap) {
        return candidate.overlap;
      }

      return best;
    }, 0) ?? 0;

  const overlapSignal =
    routing.type === 'enhance_existing' ? clamp(bestOverlap) : clamp(0.5 + bestOverlap * 0.5);

  const weightedScore =
    patternStrength * 0.4 +
    channelCoverage * 0.2 +
    modelCoverage * 0.2 +
    efficiencySignal * 0.15 +
    overlapSignal * 0.05;

  return {
    value: clamp(weightedScore),
    breakdown: {
      patternStrength,
      channelCoverage,
      modelCoverage,
      efficiencySignal,
      overlapSignal,
    },
  };
}
