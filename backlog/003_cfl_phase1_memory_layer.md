---
id: wi-003
title: CFL Phase 1 - Implement Control Plane Memory Kernel and Composition Adapters
type: work-item
subtype: task
lifecycle: active
status: ready
priority: high
estimated: 40
links:
  depends_on:
    - "[[wi-001]]"
    - "[[wi-002]]"
    - "[[wi-026]]"
---

## Goal

Implement the selected MVP local-first memory kernel for Nirvana's control plane, plus the canonical memory contract and conformance tests that external providers must satisfy in MVP+1.

## Background

The memory layer should preserve embedded local defaults for MVP while avoiding lock-in over time. This work item intentionally does not implement broad multi-backend external composition; that depth is deferred to MVP+1 planning and execution in [[027_cfl_mvp_plus1_external_composition_spike]].

## Tasks

- [ ] Implement the selected MVP local-first memory backend
  - Episodic tier (7-day TTL)
  - Semantic tier (30-day TTL)
  - Procedural/proposal tier
- [ ] Define canonical memory provider interface for composed backends
  - Read/write contract for episodes, patterns, signals, and proposals
  - Capability metadata (ttl support, vector search, graph traversal)
- [ ] Implement adapter for the selected MVP backend
- [ ] Implement contract/conformance test harness for future backends
- [ ] Implement pattern detection engine owned by Nirvana control plane
  - Frequency analysis
  - Temporal clustering
  - Signal catalog matching
- [ ] Add memory governance metadata
  - Source backend
  - Confidence inputs
  - Retention and replay provenance
- [ ] Implement compaction, cleanup, and replay utilities for selected MVP backend
- [ ] Document deferred MVP+1 external migration work and handoff requirements to [[027_cfl_mvp_plus1_external_composition_spike]]

## Deliverables

1. Selected MVP local-first memory kernel implementation
2. Canonical memory provider interface and selected-backend adapter
3. Contract/conformance test harness for future backends
4. Pattern detection engine (frequency, temporal, signal-based)
5. Three-tier memory lifecycle with retention governance
6. Test suite for selected backend adapter and pattern detection accuracy

## Acceptance Criteria

- [ ] Embedded MVP store runs fully local with no required external service
- [ ] Canonical provider interface defined and documented for MVP+1 composition
- [ ] Selected MVP backend passes contract/conformance test suite
- [ ] Pattern detection engine behavior is backend-agnostic
- [ ] Retention policy is enforced across episodic, semantic, and procedural tiers
- [ ] MVP+1 migration and external backend implementation scope is explicitly deferred to [[027_cfl_mvp_plus1_external_composition_spike]]
- [ ] Pattern metadata includes backend/source provenance for auditability
- [ ] Test coverage ≥75% for adapter and detection logic

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - Memory architecture
- See: [[002_cfl_phase1_capture_events_skill]] - Event capture dependency
- See: [[026_cfl_mvp_composition_selection_spike]] - MVP tool selection decisions
- See: [[027_cfl_mvp_plus1_external_composition_spike]] - MVP+1 external composition scope
