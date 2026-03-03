---
"$schema": https://raw.githubusercontent.com/templjs/templ.js/main/schemas/frontmatter/by-type/document/current.json
title: WI-003 to WI-027 Memory Handoff
lifecycle: active
created: 2026-03-03
audience: PAX contributors
---

Handoff requirements from `wi-003` (MVP local memory kernel) to
`wi-027` (MVP+1 external composition spike).

## Delivered in WI-003

1. Canonical memory provider contract with semantic retrieval operations
2. Two local adapters (`sqlite-counterpart`, `lance-counterpart`) passing shared conformance tests
3. Memory kernel with:
   - tiered TTL behavior (`episodic` 7d, `semantic` 30d, `procedural` none)
   - routing controls (`primary-first` / `fallback-first`)
   - replay and compaction utilities
4. A/B benchmark harness and selection evidence

## Deferred to WI-027

1. External memory provider integrations (LlamaIndex/Mem0/Zep-class targets)
2. Managed/hosted backend rollout and portability model
3. External outage and failover reliability contracts
4. Multi-backend migration waves beyond local defaults

## Required Inputs for WI-027

1. Reuse the canonical contract in:
   - `src/packages/core/src/memory/provider.ts`
   - `src/packages/core/src/memory/types.ts`
2. Reuse conformance harness:
   - `src/packages/core/src/memory/conformance.ts`
3. Keep benchmark dimensions consistent with WI-003 report:
   - recall@k
   - ranking quality (MRR)
   - p50/p95 query latency
   - ingest/update throughput
   - storage footprint

## Compatibility Constraints

1. External adapters must preserve `MemoryRecord` governance fields:
   - `sourceBackend`
   - `confidenceInputs`
   - `retentionTier`
   - `replayProvenance`
2. External adapters must support semantic retrieval contract semantics:
   - `topK`
   - `similarityThreshold`
   - optional `kind` filtering
3. Local fallback path must remain operable when external providers are unavailable.

## Acceptance Mapping

This document satisfies the `wi-003` task:

- Document deferred MVP+1 external migration work and handoff requirements to `[[027_cfl_mvp_plus1_external_composition_spike]]`.
