---
id: wi-014
title: CFL Phase 7 - Aspect Usage Pattern Detection
type: work-item
subtype: task
lifecycle: active
status: ready
priority: high
estimated: 20
links:
  depends_on:
    - "[[wi-004]]"
---

## Goal

Detect aspect usage patterns to recommend aspect updates or new aspect creation for cross-cutting concerns.

## Background

PAX aspects (like interaction-modes) represent cross-cutting concerns that affect multiple skills. The CFL should detect when patterns span multiple contexts, suggesting aspect creation or enhancement rather than individual skill creation.

## Tasks

- [ ] Implement aspect usage tracking in events
- [ ] Create cross-cutting pattern detector
- [ ] Add aspect candidate identification heuristics
- [ ] Implement existing aspect enhancement detection
- [ ] Create aspect recommendation format
- [ ] Add aspect impact analysis (which skills would benefit?)
- [ ] Implement aspect proposal generation
- [ ] Create aspect evolution analytics

## Deliverables

1. Aspect usage tracking
2. Cross-cutting pattern detection
3. Aspect candidate identification
4. Enhancement detection for existing aspects
5. Aspect recommendation format
6. Impact analysis for aspect proposals
7. Aspect proposal generation
8. Test suite for aspect detection

## Acceptance Criteria

- [ ] Aspect usage tracked across skills
- [ ] Cross-cutting patterns detected (affects 3+ skills)
- [ ] Aspect candidates identified with confidence scores
- [ ] Existing aspect enhancements suggested when appropriate
- [ ] Recommendations explain cross-cutting rationale
- [ ] Impact analysis shows affected skills
- [ ] Test coverage ≥70% for aspect detection

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - Aspect detection
- See: [[004_cfl_phase2_creating_skill_workflow]] - Routing to aspects
- Reference: PAX aspects/ directory for examples
