import { describe, expect, it } from 'vitest';
import { routeRecommendation } from './routing';
import { RecommendationInput } from './types';

function buildInput(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    patternId: 'pattern-001',
    useCase: 'Repeated PR feedback about missing regression tests',
    occurrences: 4,
    channels: ['cli', 'ide'],
    modelCohorts: ['gpt-5', 'claude-sonnet'],
    workspaceSpecific: false,
    interactionMode: 'yolo',
    ...overrides,
  };
}

describe('routeRecommendation', () => {
  it('routes routing-focused patterns to AGENTS updates first', () => {
    const decision = routeRecommendation(
      buildInput({
        affectsAgentRouting: true,
        skillOverlaps: [{ skillId: 'update-work-item', overlap: 0.92 }],
      })
    );

    expect(decision.type).toBe('update_agents');
    expect(decision.targetSkillId).toBeUndefined();
  });

  it('routes cross-cutting behavior to aspect updates', () => {
    const decision = routeRecommendation(
      buildInput({
        affectsAspectBehavior: true,
      })
    );

    expect(decision.type).toBe('update_aspect');
  });

  it('enhances existing skills when overlap is high', () => {
    const decision = routeRecommendation(
      buildInput({
        skillOverlaps: [
          { skillId: 'update-work-item', overlap: 0.74 },
          { skillId: 'finalize-work-item', overlap: 0.71 },
        ],
      })
    );

    expect(decision.type).toBe('enhance_existing');
    expect(decision.targetSkillId).toBe('update-work-item');
  });

  it('routes workspace-specific patterns to project skills', () => {
    const decision = routeRecommendation(
      buildInput({
        workspaceSpecific: true,
        skillOverlaps: [{ skillId: 'update-work-item', overlap: 0.4 }],
      })
    );

    expect(decision.type).toBe('create_project_skill');
  });

  it('routes reusable low-overlap patterns to new PAX skills', () => {
    const decision = routeRecommendation(
      buildInput({
        workspaceSpecific: false,
        skillOverlaps: [{ skillId: 'update-work-item', overlap: 0.55 }],
      })
    );

    expect(decision.type).toBe('create_pax_skill');
  });
});
