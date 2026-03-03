import { describe, expect, it } from 'vitest';
import { computeConfidenceScore } from './confidence';
import { routeRecommendation } from './routing';
import { RecommendationInput } from './types';

function buildInput(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    patternId: 'pattern-101',
    useCase: 'Reduce repeated manual PR feedback handling',
    occurrences: 4,
    channels: ['cli'],
    modelCohorts: ['gpt-5'],
    workspaceSpecific: false,
    interactionMode: 'yolo',
    estimatedTimeSavedMinutes: 15,
    ...overrides,
  };
}

describe('computeConfidenceScore', () => {
  it('increases confidence with broader channel/model coverage', () => {
    const narrowInput = buildInput({
      channels: ['cli'],
      modelCohorts: ['gpt-5'],
    });

    const broadInput = buildInput({
      channels: ['cli', 'ide', 'extension'],
      modelCohorts: ['gpt-5', 'claude-sonnet', 'gemini-2.5'],
    });

    const narrowScore = computeConfidenceScore(
      narrowInput,
      routeRecommendation(narrowInput)
    );
    const broadScore = computeConfidenceScore(
      broadInput,
      routeRecommendation(broadInput)
    );

    expect(broadScore.value).toBeGreaterThan(narrowScore.value);
    expect(broadScore.breakdown.channelCoverage).toBeGreaterThan(
      narrowScore.breakdown.channelCoverage
    );
    expect(broadScore.breakdown.modelCoverage).toBeGreaterThan(
      narrowScore.breakdown.modelCoverage
    );
  });

  it('boosts overlap signal when route targets existing skill enhancement', () => {
    const enhanceInput = buildInput({
      skillOverlaps: [{ skillId: 'update-work-item', overlap: 0.85 }],
    });

    const createInput = buildInput({
      skillOverlaps: [{ skillId: 'update-work-item', overlap: 0.4 }],
    });

    const enhanceScore = computeConfidenceScore(
      enhanceInput,
      routeRecommendation(enhanceInput)
    );
    const createScore = computeConfidenceScore(
      createInput,
      routeRecommendation(createInput)
    );

    expect(enhanceScore.breakdown.overlapSignal).toBeGreaterThan(
      createScore.breakdown.overlapSignal
    );
  });

  it('always returns a normalized score between 0 and 1', () => {
    const input = buildInput({
      occurrences: 99,
      channels: ['cli', 'ide', 'extension', 'editor', 'assistant'],
      modelCohorts: ['gpt-5', 'claude-sonnet', 'gemini-2.5', 'llama-4'],
      estimatedTimeSavedMinutes: 240,
      skillOverlaps: [{ skillId: 'update-work-item', overlap: 1 }],
    });

    const score = computeConfidenceScore(input, routeRecommendation(input));

    expect(score.value).toBeGreaterThanOrEqual(0);
    expect(score.value).toBeLessThanOrEqual(1);
  });
});
