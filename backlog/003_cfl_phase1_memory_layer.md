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

Implement the MVP local-first memory kernel for Nirvana's control plane with semantic search as a required capability, plus canonical contracts and conformance tests for composed providers.

## Background

Semantic retrieval is a fundamental MVP requirement for Nirvana's recommendation workflow, not an optional enhancement. This work item therefore includes two in-scope local MVP backends: a SQLite counterpart implementation and a LanceDB implementation, with an explicit A/B evaluation to select default runtime behavior.

This item still avoids broad external multi-provider rollout; deeper hosted/composed expansion remains deferred to [[027_cfl_mvp_plus1_external_composition_spike]].

## Tasks

- [ ] Implement MVP local-first memory kernel with required semantic retrieval behavior
  - Episodic tier (7-day TTL)
  - Semantic tier (30-day TTL)
  - Procedural/proposal tier
- [ ] Define canonical memory provider interface for composed backends
  - Read/write contract for episodes, patterns, signals, and proposals
  - Semantic retrieval contract (embedding upsert/query, similarity threshold, top-k)
  - Capability metadata (ttl support, vector search, graph traversal)
- [ ] Implement SQLite counterpart adapter for MVP memory contract
- [ ] Implement LanceDB adapter for MVP memory contract
- [ ] Implement contract/conformance test harness shared by SQLite and LanceDB adapters
- [ ] Implement A/B benchmark harness for SQLite counterpart vs LanceDB
  - Recall@k and ranking quality on seeded scenarios
  - Query latency (p50/p95)
  - Ingest/update throughput
  - Local disk/storage footprint
- [ ] Select and document MVP default behavior from A/B results
  - Define primary backend/default path
  - Define fallback path and switching controls
- [ ] Implement pattern detection engine owned by Nirvana control plane
  - Frequency analysis
  - Temporal clustering
  - Signal catalog matching
- [ ] Add memory governance metadata
  - Source backend
  - Confidence inputs
  - Retention and replay provenance
- [ ] Implement compaction, cleanup, and replay utilities for selected MVP default and fallback path
- [ ] Document deferred MVP+1 external migration work and handoff requirements to [[027_cfl_mvp_plus1_external_composition_spike]]

## Deliverables

1. MVP memory kernel with explicit semantic retrieval capability
2. Canonical memory provider interface including semantic retrieval contract
3. SQLite counterpart adapter and LanceDB adapter implementing the same contract
4. Shared contract/conformance test harness for both adapters
5. A/B benchmark report (SQLite counterpart vs LanceDB) with default selection rationale
6. Pattern detection engine (frequency, temporal, signal-based)
7. Three-tier memory lifecycle with retention governance
8. Test suite for adapters, retrieval behavior, and detection logic

## Acceptance Criteria

- [ ] Semantic retrieval is implemented and required in MVP workflows
- [ ] SQLite counterpart and LanceDB both run fully local with no required external service
- [ ] SQLite counterpart and LanceDB both pass canonical contract/conformance tests
- [ ] A/B benchmark evidence is recorded for recall@k, latency, throughput, and footprint
- [ ] MVP default backend behavior is selected and justified from benchmark evidence
- [ ] Fallback path between SQLite counterpart and LanceDB is documented and testable
- [ ] Pattern detection engine behavior is backend-agnostic
- [ ] Retention policy is enforced across episodic, semantic, and procedural tiers
- [ ] MVP+1 migration and external backend implementation scope is explicitly deferred to [[027_cfl_mvp_plus1_external_composition_spike]]
- [ ] Pattern metadata includes backend/source provenance for auditability
- [ ] Test coverage >=75% for adapters, retrieval behavior, and detection logic

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - Memory architecture
- See: [[docs/how-to/cfl-mvp-composition-selection-matrix.md]] - MVP composition decisions
- See: [[002_cfl_phase1_capture_events_skill]] - Event capture dependency
- See: [[026_cfl_mvp_composition_selection_spike]] - MVP tool selection decisions
- See: [[027_cfl_mvp_plus1_external_composition_spike]] - MVP+1 external composition scope
