---
id: wi-009
title: CFL Phase 4 - Frequency-Weighted Skill Harvesting
type: work-item
subtype: task
lifecycle: active
status: ready
priority: high
estimated: 20
links:
  depends_on:
    - "[[wi-008]]"
---

## Goal

Implement frequency-weighted skill harvesting that prioritizes automation of high-frequency, high-effort patterns based on efficiency ROI.

## Background

Skill harvesting identifies patterns worth promoting to skills by analyzing frequency × effort. Low-frequency, high-effort patterns may not justify automation cost. The CFL should focus on "skill debt" - repeated manual workflows that could be automated.

## Tasks

- [ ] Implement frequency weighting algorithm
- [ ] Add effort estimation (time per manual execution)
- [ ] Create skill debt calculation (frequency × effort × opportunity_cost)
- [ ] Implement harvesting threshold configuration
- [ ] Add pattern clustering (group similar patterns)
- [ ] Create skill harvesting recommendation format
- [ ] Implement "quick wins" detection (low creation cost, high ROI)
- [ ] Add harvesting analytics dashboard data

## Deliverables

1. Frequency weighting algorithm
2. Effort estimation model
3. Skill debt calculation
4. Harvesting threshold configuration
5. Pattern clustering for grouping
6. Skill harvesting recommendations
7. Quick wins detector
8. Test suite for harvesting logic

## Acceptance Criteria

- [ ] Patterns ranked by frequency × effort
- [ ] Skill debt calculated for all candidates
- [ ] Harvesting threshold filters low-value patterns
- [ ] Similar patterns clustered (can be addressed by one skill)
- [ ] Quick wins identified (ROI > 5.0, creation cost < 8 hours)
- [ ] Recommendations explain frequency and effort justification
- [ ] Test coverage ≥75% for harvesting logic

## Related Work

- See: [[008_cfl_phase4_efficiency_metrics]] - Efficiency metrics dependency
- See: [[docs/architecture/continuous-feedback-loop.md]] - Skill harvesting
- See: [[004_cfl_phase2_creating_skill_workflow]] - Recommendation generation
