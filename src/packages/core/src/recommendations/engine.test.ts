import { describe, expect, it } from 'vitest';
import { generateSkillRecommendation } from './engine';
import { RecommendationInput } from './types';

function buildInput(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    patternId: 'pattern-202',
    useCase: 'Automate recurring work-item updates after PR review loops',
    occurrences: 5,
    channels: ['cli', 'ide'],
    modelCohorts: ['gpt-5', 'claude-sonnet'],
    workspaceSpecific: false,
    interactionMode: 'yolo',
    evidenceIds: ['ep-100', 'ep-101'],
    estimatedTimeSavedMinutes: 45,
    skillOverlaps: [{ skillId: 'update-work-item', overlap: 0.78 }],
    memoryQuery: {
      embedding: [1, 0, 0],
      kind: 'pattern',
      similarityThreshold: 0.7,
      topK: 5,
    },
    telemetryEvidence: {
      elapsedTimeDeltaPct: -0.25,
      requestDeltaPct: -0.2,
      qualityLiftPct: 0.15,
    },
    ...overrides,
  };
}

describe('generateSkillRecommendation', () => {
  it('generates delegation-only recommendation output in YOLO mode', async () => {
    const recommendation = await generateSkillRecommendation(buildInput(), {
      memory: {
        async semanticSearch() {
          return [
            {
              score: 0.86,
              record: {
                id: 'pattern-memory-1',
                kind: 'pattern',
                tier: 'semantic',
                content: 'Recurring PR feedback around missing test updates.',
                metadata: {},
                createdAt: '2026-03-03T00:00:00.000Z',
                updatedAt: '2026-03-03T00:00:00.000Z',
                expiresAt: null,
                embedding: [1, 0, 0],
                governance: {
                  sourceBackend: 'sqlite-counterpart',
                  confidenceInputs: ['seeded'],
                  retentionTier: 'semantic',
                  replayProvenance: 'seeded',
                },
              },
            },
            {
              score: 0.61,
              record: {
                id: 'pattern-memory-2',
                kind: 'pattern',
                tier: 'semantic',
                content: 'Low confidence match that should be filtered.',
                metadata: {},
                createdAt: '2026-03-03T00:00:00.000Z',
                updatedAt: '2026-03-03T00:00:00.000Z',
                expiresAt: null,
                embedding: [0.5, 0.5, 0],
                governance: {
                  sourceBackend: 'sqlite-counterpart',
                  confidenceInputs: ['seeded'],
                  retentionTier: 'semantic',
                  replayProvenance: 'seeded',
                },
              },
            },
          ];
        },
      },
      skillCatalog: [
        {
          id: 'update-work-item',
          summary: 'Update existing work item status and metadata with lifecycle safeguards.',
          tags: ['backlog', 'workflow', 'status'],
        },
      ],
    });

    expect(recommendation.summary.requiresUserInput).toBe(false);
    expect(recommendation.delegation.executionPolicy).toBe('delegation_only');
    expect(recommendation.routing.type).toBe('enhance_existing');
    expect(recommendation.evidence.memoryMatches).toHaveLength(1);
    expect(recommendation.evidence.memoryMatches[0].recordId).toBe('pattern-memory-1');
    expect(recommendation.detail.rationale.length).toBeGreaterThan(0);
    expect(recommendation.detail.proposedChanges.length).toBeGreaterThan(0);
    expect(recommendation.evidence.telemetry).not.toBeNull();
    expect(recommendation.summary.roiForecast).toBeGreaterThan(0);
    expect(recommendation.evidence.efficiency.forecast.roi).toBe(
      recommendation.summary.roiForecast
    );
    expect(recommendation.detail.disclosure.summary.split(/\s+/).length).toBeLessThanOrEqual(100);
  });

  it('adds a review prompt in collaborative mode', async () => {
    const recommendation = await generateSkillRecommendation(
      buildInput({
        interactionMode: 'collaborative',
        workspaceSpecific: true,
        skillOverlaps: [{ skillId: 'update-work-item', overlap: 0.35 }],
      })
    );

    expect(recommendation.summary.requiresUserInput).toBe(true);
    expect(recommendation.detail.userPrompt).toContain('Collaborative mode');
    expect(recommendation.routing.type).toBe('create_project_skill');
    expect(recommendation.detail.nextSteps[0]).toContain('Review');
  });
});
