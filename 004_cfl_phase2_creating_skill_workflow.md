---
id: wi-004
title: CFL Phase 2 - Implement creating-skill Workflow
type: work-item
subtype: task
lifecycle: active
status: ready
priority: high
estimated: 36
links:
  depends_on:
    - "[[wi-003]]"
---

## Goal

Implement the `creating-skill` workflow that evaluates skill ideas against memory patterns and recommends enhance/create/compose actions with confidence scoring.

## Background

The creating-skill workflow is the recommendation engine of the CFL. It analyzes detected patterns and memory, searches existing skills, and generates actionable recommendations using a hybrid routing matrix. Critical: it NEVER creates skills directly, always delegating to skill-creator per PAX conventions.

## Tasks

- [ ] Implement `skills/workflow/creating-skill/SKILL.md` as executable workflow
- [ ] Create 5-phase workflow (input → search → analyze → recommend → delegate)
- [ ] Implement hybrid routing matrix:
  - Enhance existing skill (high overlap with existing)
  - Create PAX skill (general-purpose, reusable)
  - Create project skill (workspace-specific)
  - Update aspect (cross-cutting concern)
  - Update AGENTS.md (routing/delegation logic)
- [ ] Implement confidence scoring algorithm
- [ ] Add memory pattern search and similarity matching
- [ ] Integrate with existing skills library search
- [ ] Create recommendation format with rationale and evidence
- [ ] Add interaction-modes aspect integration (YOLO vs Collaborative)

## Deliverables

1. Executable `creating-skill` workflow in `skills/workflow/creating-skill/`
2. Hybrid routing matrix implementation
3. Confidence scoring algorithm (0.0-1.0 scale)
4. Memory pattern search and matching
5. Recommendation format specification
6. Interaction-modes integration
7. Test suite for routing logic and confidence scoring

## Acceptance Criteria

- [ ] Workflow processes pattern input and generates recommendations
- [ ] Hybrid routing matrix correctly classifies scenarios
- [ ] Confidence scores correlate with pattern strength
- [ ] Memory search finds similar patterns (cosine similarity ≥0.7)
- [ ] Recommendations include rationale and supporting evidence
- [ ] YOLO mode auto-generates recommendations
- [ ] Collaborative mode prompts for user input
- [ ] NEVER creates skills directly (always delegates)
- [ ] Test coverage ≥80% for routing and scoring logic

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - Recommendation engine
- See: [[003_cfl_phase1_memory_layer]] - Memory dependency
- Implements: [[skills/workflow/creating-skill/SKILL.md]] specification
- Delegates to: skill-creator (mandatory)
