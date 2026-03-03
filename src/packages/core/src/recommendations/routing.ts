import { RecommendationInput, RoutingDecision } from './types';

const ENHANCE_EXISTING_THRESHOLD = 0.7;

export function routeRecommendation(input: RecommendationInput): RoutingDecision {
  if (input.affectsAgentRouting) {
    return {
      type: 'update_agents',
      reason:
        'Pattern changes agent routing or delegation behavior, so AGENTS.md routing is the safest target.',
    };
  }

  if (input.affectsAspectBehavior) {
    return {
      type: 'update_aspect',
      reason:
        'Pattern is cross-cutting behavior and should be implemented as an aspect instead of a task-specific skill.',
    };
  }

  let bestOverlap: RecommendationInput['skillOverlaps'][number] | undefined;

  for (const candidate of input.skillOverlaps ?? []) {
    if (!bestOverlap || candidate.overlap > bestOverlap.overlap) {
      bestOverlap = candidate;
    }
  }

  if (bestOverlap && bestOverlap.overlap >= ENHANCE_EXISTING_THRESHOLD) {
    return {
      type: 'enhance_existing',
      reason: `Pattern overlaps existing skill ${bestOverlap.skillId} at ${bestOverlap.overlap.toFixed(2)}.`,
      targetSkillId: bestOverlap.skillId,
    };
  }

  if (input.workspaceSpecific) {
    return {
      type: 'create_project_skill',
      reason: 'Pattern is workspace-specific, so recommendation remains local to this project.',
    };
  }

  return {
    type: 'create_pax_skill',
    reason: 'Pattern is reusable across projects and has no high-overlap existing skill target.',
  };
}
