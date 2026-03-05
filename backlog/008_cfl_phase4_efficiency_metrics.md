---
id: wi-008
title: CFL Phase 4 - Implement Control Plane Efficiency and ROI Metrics
type: work-item
subtype: task
lifecycle: active
status: ready-for-review
priority: high
estimated: 28
actual: 5
test_results:
  - timestamp: 2026-03-05T00:00:00.000Z
    note: "pnpm test -- src/packages/core/src/recommendations/efficiency.test.ts (6 tests passed; sample validation gate)"
  - timestamp: 2026-03-05T00:00:00.000Z
    note: "pnpm test -- src/packages/core/src/recommendations/engine.test.ts src/packages/core/src/recommendations/confidence.test.ts (5 tests passed)"
  - timestamp: 2026-03-05T00:00:00.000Z
    note: "pnpm test -- src/packages/core/src/recommendations/*.test.ts (34 tests passed)"
notes:
  - timestamp: 2026-03-05T00:00:00.000Z
    note: "Implemented canonical efficiency metric schema, local-first metric collector, ROI forecast-vs-realized tracker, and telemetry/eval adapter contract in `src/packages/core/src/recommendations/efficiency.ts`."
  - timestamp: 2026-03-05T00:00:00.000Z
    note: "Integrated efficiency evidence into recommendation output and scoring (`engine.ts`, `confidence.ts`), including forecast ROI, high-ROI flagging, and initialized realized tracking payload."
  - timestamp: 2026-03-05T00:00:00.000Z
    note: "Implemented progressive disclosure tiers (summary/detail/evidence with <=100-token summary cap) and ROI-first proposal review ordering."
links:
  depends_on:
    - "[[wi-004]]"
    - "[[wi-026]]"
  pull_requests:
    - "https://github.com/squirrel289/nirvana/pull/2"
---

## Goal

Implement efficiency and ROI instrumentation owned by Nirvana's control plane, with adapter interfaces for composed telemetry and eval providers.

## Background

Not all patterns are worth automating. The control plane should normalize metrics across local-first defaults and external providers so ranking remains consistent regardless of backend selection.

## Tasks

- [x] Implement canonical metric schema (token/context/request/time + quality signals)
- [x] Add local-first metric collectors for MVP
- [x] Implement telemetry/eval provider adapter interface (for MVP+1 composition)
- [x] Create ROI calculation algorithm and forecast-vs-realized tracker
- [x] Add frequency tracking for patterns (how often does pattern occur?)
- [x] Implement time-saved estimation (comparison with manual workflow)
- [x] Create creation cost estimation (hours to implement skill)
- [x] Add efficiency metrics to recommendation scoring
- [x] Implement progressive disclosure (summary/detail/evidence tiers)

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

- [x] Canonical metrics captured for all recommendations regardless of backend
- [x] Execution time recorded with millisecond precision
- [x] Context overhead measured in tokens
- [x] ROI forecast and realized values captured for all recommendations
- [x] Recommendations ranked by ROI (highest first)
- [x] Progressive disclosure preserves context (summary fits in 100 tokens)
- [x] High-ROI patterns prioritized (threshold configurable)
- [x] Test coverage ≥75% for metrics and scoring

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - Efficiency optimization
- See: [[004_cfl_phase2_creating_skill_workflow]] - Recommendation engine
- See: [[026_cfl_mvp_composition_selection_spike]] - MVP composition decisions
- See: [[027_cfl_mvp_plus1_external_composition_spike]] - MVP+1 provider composition
