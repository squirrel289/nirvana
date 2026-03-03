---
id: wi-004
title: CFL Phase 2 - Implement Control Plane Recommendation Workflow
type: work-item
subtype: task
lifecycle: active
status: in-progress
priority: high
estimated: 36
actual: 1
assignee: ""
notes:
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "Execution started after dependency closure verification (`[[wi-003]]` and `[[wi-026]]` closed); implementation remains in progress."
links:
  depends_on:
    - "[[wi-003]]"
    - "[[wi-026]]"
---

## Goal

Implement the recommendation policy workflow that turns captured signals into evidence-backed, human-reviewable control-plane proposals.

## Background

This workflow is Nirvana's core differentiator. It should remain vendor-neutral and consume composed telemetry/memory inputs without delegating recommendation policy itself to third-party tools.

## Tasks

- [ ] Implement `skills/workflow/creating-skill/SKILL.md` as executable control-plane workflow
- [ ] Create 5-phase workflow (input → search → analyze → recommend → delegate)
- [ ] Implement hybrid routing matrix:
  - Enhance existing skill (high overlap with existing)
  - Create PAX skill (general-purpose, reusable)
  - Create project skill (workspace-specific)
  - Update aspect (cross-cutting concern)
  - Update AGENTS.md (routing/delegation logic)
- [ ] Implement confidence scoring algorithm with cross-channel and cross-model factors
- [ ] Add memory pattern search and similarity matching through provider interfaces
- [ ] Integrate with existing skills library search and composed observability/eval signals
- [ ] Create recommendation format with rationale and evidence
- [ ] Add interaction-modes aspect integration (YOLO vs Collaborative)

## Deliverables

1. Executable `creating-skill` workflow in `skills/workflow/creating-skill/`
2. Hybrid routing matrix implementation
3. Confidence and ranking policy engine (0.0-1.0 scale)
4. Provider-agnostic signal intake (memory + telemetry + eval evidence)
5. Recommendation format specification with ROI governance fields
6. Interaction-modes integration
7. Test suite for routing and ranking logic

## Acceptance Criteria

- [ ] Workflow processes pattern input and generates recommendations
- [ ] Hybrid routing matrix correctly classifies scenarios
- [ ] Confidence scores incorporate pattern strength plus cross-channel/model evidence
- [ ] Memory search finds similar patterns (cosine similarity ≥0.7)
- [ ] Recommendations include rationale and supporting evidence
- [ ] YOLO mode auto-generates recommendations
- [ ] Collaborative mode prompts for user input
- [ ] NEVER creates skills directly (always delegates)
- [ ] Test coverage ≥80% for routing and scoring logic

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - Recommendation engine
- See: [[003_cfl_phase1_memory_layer]] - Memory dependency
- See: [[026_cfl_mvp_composition_selection_spike]] - MVP composition selection
- Implements: [[skills/workflow/creating-skill/SKILL.md]] specification
- Delegates to: skill-creator (mandatory)
