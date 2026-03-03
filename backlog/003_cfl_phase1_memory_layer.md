---
id: wi-003
title: CFL Phase 1 - Implement Control Plane Memory Kernel and Composition Adapters
type: work-item
subtype: task
lifecycle: active
status: ready-for-review
priority: high
estimated: 40
actual: 12
assignee: ""
test_results:
  - timestamp: 2026-03-02T00:00:00.000Z
    note: "pnpm test -- src/packages/core/src/memory/conformance.test.ts src/packages/core/src/memory/kernel.test.ts (11 passed)"
  - timestamp: 2026-03-02T00:00:00.000Z
    note: "pnpm test -- src/extensions/vscode/src/providers/universal.test.ts src/extensions/vscode/src/providers/facade.test.ts (5 passed)"
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "pnpm test -- src/packages/core/src/memory/conformance.test.ts src/packages/core/src/memory/kernel.test.ts src/packages/core/src/memory/benchmark.test.ts (15 passed)"
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "pnpm test:coverage -- src/packages/core/src/memory/conformance.test.ts src/packages/core/src/memory/kernel.test.ts src/packages/core/src/memory/benchmark.test.ts (overall statements 85.46%)"
notes:
  - timestamp: 2026-03-02T00:00:00.000Z
    note: "Started WI-003 implementation on branch feature/wi-003-memory-layer-exec. Delivered canonical memory provider contract, SQLite/Lance local adapters, shared conformance suite, and initial benchmark harness."
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "Completed WI-003 remaining scope: benchmark metrics (recall@k, MRR, p50/p95, ingest/update throughput, footprint), routing controls (`primary-first`/`fallback-first`), replay+compaction utilities, temporal+catalog pattern detection, and WI-027 handoff docs."
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "Ready for review. GitHub push/PR creation is pending because this worktree has no configured git remote."
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "Closure audit completed: dependencies [[wi-001]], [[wi-002]], and [[wi-026]] are closed; implementation commits are present on `main`; no historical merged PR artifact was returned by `gh` commit→PR lookup."
links:
  depends_on:
    - "[[wi-001]]"
    - "[[wi-002]]"
    - "[[wi-026]]"
commits:
  0dab828: "feat(core): implement WI-003 memory contracts and local adapters"
  84541be: "feat(core): complete WI-003 benchmark, routing, and replay flows"
  a49131e: "docs(backlog): finalize WI-003 review metadata"
---

## Goal

Implement the MVP local-first memory kernel for Nirvana's control plane with semantic search as a required capability, plus canonical contracts and conformance tests for composed providers.

## Background

Semantic retrieval is a fundamental MVP requirement for Nirvana's recommendation workflow, not an optional enhancement. This work item therefore includes two in-scope local MVP backends: a SQLite counterpart implementation and a LanceDB implementation, with an explicit A/B evaluation to select default runtime behavior.

This item still avoids broad external multi-provider rollout; deeper hosted/composed expansion remains deferred to [[027_cfl_mvp_plus1_external_composition_spike]].

## Tasks

- [x] Implement MVP local-first memory kernel with required semantic retrieval behavior
  - Episodic tier (7-day TTL)
  - Semantic tier (30-day TTL)
  - Procedural/proposal tier
- [x] Define canonical memory provider interface for composed backends
  - Read/write contract for episodes, patterns, signals, and proposals
  - Semantic retrieval contract (embedding upsert/query, similarity threshold, top-k)
  - Capability metadata (ttl support, vector search, graph traversal)
- [x] Implement SQLite counterpart adapter for MVP memory contract
- [x] Implement LanceDB adapter for MVP memory contract
- [x] Implement contract/conformance test harness shared by SQLite and LanceDB adapters
- [x] Implement A/B benchmark harness for SQLite counterpart vs LanceDB
  - Recall@k and ranking quality on seeded scenarios
  - Query latency (p50/p95)
  - Ingest/update throughput
  - Local disk/storage footprint
- [x] Select and document MVP default behavior from A/B results
  - Define primary backend/default path
  - Define fallback path and switching controls
- [x] Implement pattern detection engine owned by Nirvana control plane
  - Frequency analysis
  - Temporal clustering
  - Signal catalog matching
- [x] Add memory governance metadata
  - Source backend
  - Confidence inputs
  - Retention and replay provenance
- [x] Implement compaction, cleanup, and replay utilities for selected MVP default and fallback path
- [x] Document deferred MVP+1 external migration work and handoff requirements to [[027_cfl_mvp_plus1_external_composition_spike]]

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

- [x] Semantic retrieval is implemented and required in MVP workflows
- [x] SQLite counterpart and LanceDB both run fully local with no required external service
- [x] SQLite counterpart and LanceDB both pass canonical contract/conformance tests
- [x] A/B benchmark evidence is recorded for recall@k, latency, throughput, and footprint
- [x] MVP default backend behavior is selected and justified from benchmark evidence
- [x] Fallback path between SQLite counterpart and LanceDB is documented and testable
- [x] Pattern detection engine behavior is backend-agnostic
- [x] Retention policy is enforced across episodic, semantic, and procedural tiers
- [x] MVP+1 migration and external backend implementation scope is explicitly deferred to [[027_cfl_mvp_plus1_external_composition_spike]]
- [x] Pattern metadata includes backend/source provenance for auditability
- [x] Test coverage >=75% for adapters, retrieval behavior, and detection logic

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - Memory architecture
- See: [[docs/how-to/cfl-mvp-composition-selection-matrix.md]] - MVP composition decisions
- See: [[docs/how-to/cfl-wi-003-memory-benchmark-report.md]] - WI-003 A/B benchmark evidence and default selection
- See: [[docs/how-to/cfl-wi-003-mvp1-handoff.md]] - WI-003 deferred MVP+1 handoff requirements
- See: [[002_cfl_phase1_capture_events_skill]] - Event capture dependency
- See: [[026_cfl_mvp_composition_selection_spike]] - MVP tool selection decisions
- See: [[027_cfl_mvp_plus1_external_composition_spike]] - MVP+1 external composition scope
