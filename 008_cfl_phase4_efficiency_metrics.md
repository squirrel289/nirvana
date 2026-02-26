---
id: wi-008
title: CFL Phase 4 - Implement Efficiency Metrics
status: not-started
priority: medium
complexity: medium
estimated_hours: 28
dependencies: [wi-004]
created: 2026-02-26
---

## Goal

Implement efficiency metrics (LLM call count, execution time, context overhead) and ROI calculation to prioritize skill recommendations by automation value.

## Background

Not all patterns are worth automating. The CFL should track efficiency metrics to identify high-value automation opportunities. ROI calculation: `(time_saved × frequency) / creation_cost` helps prioritize recommendations by impact.

## Tasks

- [ ] Implement LLM call counter (track API calls per skill/workflow)
- [ ] Add execution time tracking (start/end timestamps)
- [ ] Implement context overhead measurement (token counts)
- [ ] Create ROI calculation algorithm
- [ ] Add frequency tracking for patterns (how often does pattern occur?)
- [ ] Implement time-saved estimation (comparison with manual workflow)
- [ ] Create creation cost estimation (hours to implement skill)
- [ ] Add efficiency metrics to recommendation scoring
- [ ] Implement progressive disclosure (summary/detail/evidence tiers)

## Deliverables

1. LLM call counter integration
2. Execution time tracking
3. Context overhead measurement
4. ROI calculation algorithm
5. Frequency tracking for patterns
6. Time-saved vs creation-cost comparison
7. Efficiency-weighted recommendation ranking
8. Progressive disclosure output format
9. Test suite for metrics and ROI calculation

## Acceptance Criteria

- [ ] LLM calls tracked per skill invocation
- [ ] Execution time recorded with millisecond precision
- [ ] Context overhead measured in tokens
- [ ] ROI calculated for all recommendations
- [ ] Recommendations ranked by ROI (highest first)
- [ ] Progressive disclosure preserves context (summary fits in 100 tokens)
- [ ] High-ROI patterns prioritized (threshold configurable)
- [ ] Test coverage ≥75% for metrics and scoring

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - Efficiency optimization
- See: [[004_cfl_phase2_creating_skill_workflow]] - Recommendation engine
- Reference: `pax/evolution` for efficiency metrics examples
