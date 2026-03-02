---
id: wi-008
title: CFL Phase 4 - Implement Control Plane Efficiency and ROI Metrics
type: work-item
subtype: task
lifecycle: active
status: ready
priority: high
estimated: 28
links:
  depends_on:
    - "[[wi-004]]"
    - "[[wi-026]]"
---

## Goal

Implement efficiency and ROI instrumentation owned by Nirvana's control plane, with adapter interfaces for composed telemetry and eval providers.

## Background

Not all patterns are worth automating. The control plane should normalize metrics across local-first defaults and external providers so ranking remains consistent regardless of backend selection.

## Tasks

- [ ] Implement canonical metric schema (token/context/request/time + quality signals)
- [ ] Add local-first metric collectors for MVP
- [ ] Implement telemetry/eval provider adapter interface (for MVP+1 composition)
- [ ] Create ROI calculation algorithm and forecast-vs-realized tracker
- [ ] Add frequency tracking for patterns (how often does pattern occur?)
- [ ] Implement time-saved estimation (comparison with manual workflow)
- [ ] Create creation cost estimation (hours to implement skill)
- [ ] Add efficiency metrics to recommendation scoring
- [ ] Implement progressive disclosure (summary/detail/evidence tiers)

## Deliverables

1. Canonical metric schema and collectors
2. Local-first instrumentation implementation
3. Provider adapter contract for external telemetry/eval systems
4. ROI forecast and realized tracking algorithm
5. Frequency tracking for patterns
6. Time-saved vs creation-cost comparison
7. Efficiency-weighted recommendation ranking
8. Progressive disclosure output format
9. Test suite for metrics and ROI calculation

## Acceptance Criteria

- [ ] Canonical metrics captured for all recommendations regardless of backend
- [ ] Execution time recorded with millisecond precision
- [ ] Context overhead measured in tokens
- [ ] ROI forecast and realized values captured for all recommendations
- [ ] Recommendations ranked by ROI (highest first)
- [ ] Progressive disclosure preserves context (summary fits in 100 tokens)
- [ ] High-ROI patterns prioritized (threshold configurable)
- [ ] Test coverage ≥75% for metrics and scoring

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - Efficiency optimization
- See: [[004_cfl_phase2_creating_skill_workflow]] - Recommendation engine
- See: [[026_cfl_mvp_composition_selection_spike]] - MVP composition decisions
- See: [[027_cfl_mvp_plus1_external_composition_spike]] - MVP+1 provider composition
