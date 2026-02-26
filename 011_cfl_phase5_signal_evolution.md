---
id: wi-011
title: CFL Phase 5 - Signal Promotion and Retirement Workflow
status: not-started
priority: medium
complexity: medium
estimated_hours: 32
dependencies: [wi-010]
created: 2026-02-26
---

## Goal

Implement signal lifecycle management with promotion (candidate → validated → proven) and retirement criteria for low-performing signals.

## Background

Signals should evolve based on performance. New candidate signals require validation. Proven signals earn higher confidence. Low-performing signals should be retired to reduce noise. This creates a self-improving pattern detection system.

## Tasks

- [ ] Implement signal lifecycle states (candidate, validated, proven, retired)
- [ ] Create promotion criteria (precision thresholds, usage counts)
- [ ] Implement retirement criteria (low precision, low usage)
- [ ] Add signal promotion workflow (automatic or manual)
- [ ] Create signal retirement workflow with archival
- [ ] Implement signal versioning for evolution tracking
- [ ] Add signal catalog update automation
- [ ] Create signal evolution analytics

## Deliverables

1. Signal lifecycle state machine
2. Promotion criteria and algorithm
3. Retirement criteria and workflow
4. Signal promotion automation
5. Signal retirement with archival
6. Signal versioning system
7. Catalog update automation
8. Evolution analytics
9. Test suite for lifecycle management

## Acceptance Criteria

- [ ] Signals start as "candidate" status
- [ ] Promotion to "validated" after 10+ uses with precision ≥0.6
- [ ] Promotion to "proven" after 50+ uses with precision ≥0.8
- [ ] Retirement after precision < 0.3 for 30+ days
- [ ] Signal catalog updated automatically
- [ ] Retired signals archived (not deleted)
- [ ] Signal versions tracked for history
- [ ] Evolution analytics show promotion/retirement trends
- [ ] Test coverage ≥75% for lifecycle logic

## Related Work

- See: [[010_cfl_phase5_signal_validation]] - Performance tracking
- See: [[docs/architecture/continuous-feedback-loop.md]] - Signal evolution
- Reference: `pax/evolution` for signal lifecycle examples
