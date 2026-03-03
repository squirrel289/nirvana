---
id: wi-004
title: CFL Phase 2 - Implement Control Plane Recommendation Workflow
type: work-item
subtype: task
lifecycle: active
status: closed
status_reason: completed
completed_date: 2026-03-03
priority: high
estimated: 36
actual: 4
assignee: ""
test_results:
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "pnpm test -- src/packages/core/src/recommendations/routing.test.ts src/packages/core/src/recommendations/confidence.test.ts src/packages/core/src/recommendations/engine.test.ts (10 tests passed)"
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "pnpm test:coverage -- src/packages/core/src/recommendations/routing.test.ts src/packages/core/src/recommendations/confidence.test.ts src/packages/core/src/recommendations/engine.test.ts (`recommendations/` statements 90.10%)"
notes:
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "Execution started after dependency closure verification (`[[wi-003]]` and `[[wi-026]]` closed); implementation remains in progress."
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "Implemented `recommendations/` core module (routing, confidence scoring, memory similarity search, recommendation assembly) plus `skills/workflow/creating-skill/SKILL.md` workflow definition."
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "Moved to ready-for-review after delivering all WI-004 acceptance criteria with passing tests and coverage evidence."
links:
  depends_on:
    - "[[wi-003]]"
    - "[[wi-026]]"
commits:
  e79767d: "feat(core): implement wi-004 recommendation workflow core"
---

## Goal

Implement the recommendation policy workflow that turns captured signals into evidence-backed, human-reviewable control-plane proposals.

## Background

This workflow is Nirvana's core differentiator. It should remain vendor-neutral and consume composed telemetry/memory inputs without delegating recommendation policy itself to third-party tools.

## Tasks

- [x] Implement `skills/workflow/creating-skill/SKILL.md` as executable control-plane workflow
- [x] Create 5-phase workflow (input → search → analyze → recommend → delegate)
- [x] Implement hybrid routing matrix:
  - Enhance existing skill (high overlap with existing)
  - Create PAX skill (general-purpose, reusable)
  - Create project skill (workspace-specific)
  - Update aspect (cross-cutting concern)
  - Update AGENTS.md (routing/delegation logic)
- [x] Implement confidence scoring algorithm with cross-channel and cross-model factors
- [x] Add memory pattern search and similarity matching through provider interfaces
- [x] Integrate with existing skills library search and composed observability/eval signals
- [x] Create recommendation format with rationale and evidence
- [x] Add interaction-modes aspect integration (YOLO vs Collaborative)

## Deliverables

1. Executable `creating-skill` workflow in `skills/workflow/creating-skill/`
2. Hybrid routing matrix implementation
3. Confidence and ranking policy engine (0.0-1.0 scale)
4. Provider-agnostic signal intake (memory + telemetry + eval evidence)
5. Recommendation format specification with ROI governance fields
6. Interaction-modes integration
7. Test suite for routing and ranking logic

## Acceptance Criteria

- [x] Workflow processes pattern input and generates recommendations
- [x] Hybrid routing matrix correctly classifies scenarios
- [x] Confidence scores incorporate pattern strength plus cross-channel/model evidence
- [x] Memory search finds similar patterns (cosine similarity ≥0.7)
- [x] Recommendations include rationale and supporting evidence
- [x] YOLO mode auto-generates recommendations
- [x] Collaborative mode prompts for user input
- [x] NEVER creates skills directly (always delegates)
- [x] Test coverage ≥80% for routing and scoring logic

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - Recommendation engine
- See: [[003_cfl_phase1_memory_layer]] - Memory dependency
- See: [[026_cfl_mvp_composition_selection_spike]] - MVP composition selection
- Implements: [[skills/workflow/creating-skill/SKILL.md]] specification
- Delegates to: skill-creator (mandatory)
