---
id: wi-003
title: CFL Phase 1 - Implement Memory Layer with Pattern Detection
type: work-item
subtype: task
lifecycle: active
status: ready
priority: high
estimated: 40
links:
  depends_on:
    - "[[wi-002]]"
---

## Goal

Implement the memory layer that transforms episodic events into patterns, organized across three tiers: episodic (7-day), semantic (30-day), and procedural (permanent proposals).

## Background

The memory layer is the analysis engine of the CFL. It processes raw events from `episodes.jsonl` to detect patterns through frequency analysis, temporal clustering, and signal matching against the evolving signal catalog.

## Tasks

- [ ] Select persistent store(s)
  - Identify options. Seed with below and consider other options.
    - Avancedb + couchdb
    - PostgreSQL + pgvector
    - PostgreSQL (structured) + Redis (cache) + Qdrant (vectors)
    - Qdrant
    - FAISS
    - FalkorDB
    - Neo4j
    - Raw files
- [ ] Implement episodic memory tier (7-day TTL, JSONL storage)
- [ ] Implement semantic memory tier (30-day TTL, pattern aggregation)
- [ ] Implement procedural memory tier (permanent skill proposals)
- [ ] Create pattern detection engine:
  - Frequency analysis (repeated sequences)
  - Temporal clustering (time-based grouping)
  - Signal catalog matching
- [ ] Implement pattern schema with metadata (frequency, last_seen, confidence)
- [ ] Add pattern storage to `patterns.json` with versioning
- [ ] Create signal catalog loader from `signals.json`
- [ ] Implement background pattern analysis on idle
- [ ] Add memory compaction/cleanup workflows

## Deliverables

1. Capture considered and selected persistent storage options in an `architecture-decision-record`
2. Memory layer implementation in `vscode-pax-feedback/src/memory/`
3. Pattern detection algorithms (frequency, temporal, signal-based)
4. Three-tier memory architecture with TTL management
5. Pattern storage in `patterns.json`
6. Signal catalog integration
7. Background analysis scheduler
8. Test suite for pattern detection accuracy

## Acceptance Criteria

- [ ] Architecure decision record created
- [ ] Episodic memory stores events with 7-day TTL
- [ ] Semantic memory aggregates patterns with 30-day TTL
- [ ] Procedural memory persists skill proposals indefinitely
- [ ] Pattern detection identifies repeated sequences (≥3 occurrences)
- [ ] Temporal clustering groups related events within time windows
- [ ] Signal catalog matching identifies known patterns
- [ ] Patterns stored with confidence scores and metadata
- [ ] Background analysis runs during idle periods (no blocking)
- [ ] Test coverage ≥75% for pattern detection logic

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - Memory architecture
- See: [[002_cfl_phase1_capture_events_skill]] - Event capture dependency
- Reference: `pax/evolution` for signal catalog examples
