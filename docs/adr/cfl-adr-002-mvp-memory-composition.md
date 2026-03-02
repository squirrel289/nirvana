---
"$schema": https://raw.githubusercontent.com/templjs/templ.js/main/schemas/frontmatter/by-type/document/current.json
title: CFL ADR 002 - MVP Memory Composition Strategy
lifecycle: active
type: document
subtype: adr
status: approved
status_comment: Accepted for MVP implementation planning and execution (`wi-026`, approved 2026-03-02).
created: 2026-03-02
audience: PAX contributors
---

## Context

Nirvana must preserve local-first defaults while enabling external composition in MVP+1. Memory infrastructure is a potential duplication hotspot if backend implementation scope is not constrained.

`wi-003` defines semantic retrieval as a required MVP capability and narrows implementation to selected local defaults plus canonical contracts and tests.

## Decision

1. MVP record-of-truth memory substrate is embedded JSONL + SQLite for local-first durability and replay.
2. MVP memory contract is canonical and backend-agnostic, including read/write behavior for episodes, patterns, signals, and proposals, plus required semantic retrieval operations.
3. MVP implements two local adapters under the same contract: SQLite counterpart and LanceDB.
4. Both adapters must pass a shared contract/conformance harness and run fully local with no mandatory external services.
5. MVP runs an A/B benchmark (recall@k, p50/p95 latency, ingest/update throughput, and disk footprint) to select primary runtime behavior and a documented fallback path.
6. Nirvana owns memory semantics (episodic/semantic/procedural tiers), retention policy, and provenance metadata regardless of backend.
7. External memory provider rollout depth remains deferred to `wi-027`.

## Consequences

Positive:

1. MVP delivery remains local-first while satisfying mandatory semantic retrieval requirements.
2. Control-plane semantics stay stable regardless of backend composition.
3. Benchmark-based default selection reduces guesswork and informs fallback behavior.

Trade-offs:

1. MVP includes additional implementation/testing work to support two local adapters.
2. Some advanced memory capabilities and broad external rollout remain deferred to MVP+1.

## Rejected Alternatives

1. Single local backend with no A/B evidence for semantic retrieval quality/performance.
2. Full external multi-backend rollout in MVP (too much scope for limited differentiation).
3. Immediate managed memory dependency for baseline operation (violates local-first default).

## References

1. [CFL MVP Composition Selection Matrix](../how-to/cfl-mvp-composition-selection-matrix.md)
2. [CFL MVP vs MVP+1 Scope Boundary](../how-to/cfl-mvp-vs-mvp-plus1-scope-boundary.md)
3. `wi-003`, `wi-026`, `wi-027`
