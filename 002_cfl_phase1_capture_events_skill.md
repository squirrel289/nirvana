---
id: wi-002
title: CFL Phase 1 - Implement capture-events Skill
status: closed
status_reason: completed
priority: high
created: 2026-02-26
estimated: 40
assignee: ''
test_results:
  - timestamp: 2026-02-26T08:00.000Z
    note: '54 unit tests: ALL PASSED ✅'
actual: 2
completed_date: 2026-02-24
commits:
  - babe358: "feat: implement capture-events skill (wi-002)"
links:
  depends_on:
    - "[[001_cfl_phase0_extension_scaffolding]]
  pull_requests:
    - "https://github.com/templjs/templ.js/pull/1"
---

## Goal

Implement the `capture-events` skill with provider adapters (Universal, Copilot, Codex, Cursor) to capture workspace signals into standardized event format.

## Background

The capture-events skill is the input layer of the CFL. It abstracts workspace signals (file modifications, terminal commands, diagnostics, skill invocations) into standardized JSON events stored in `.vscode/pax-memory/episodes.jsonl`.

Following PAX's assistant-agnostic philosophy, the skill uses a facade pattern to delegate to provider-specific adapters while maintaining a consistent API.

## Tasks

- [x] Implement `skills/tools/capture-events/SKILL.md` as executable skill
- [x] Create event schema with timestamp, provider, event_type, metadata
- [x] Implement universal provider event capture:
  - [x] File watcher integration (create, modify, delete)
  - [x] Terminal output parser (commands, errors, success)
  - [x] Diagnostic collector (errors, warnings, info)
  - [x] Skill invocation tracker
- [x] Implement provider facade with auto-detection logic
- [x] Add background mode (continuous capture) and on-demand mode
- [x] Implement JSONL append-only storage to `episodes.jsonl`
- [x] Add 7-day TTL cleanup for episodic memory
- [x] Create unit tests for event capture and storage

## Deliverables

1. Executable `capture-events` skill in `skills/tools/capture-events/`
2. Event schema definition and validation
3. Universal provider implementation with full workspace coverage
4. Provider facade with auto-detection
5. JSONL storage handler with TTL management
6. Test suite validating all event types

## Acceptance Criteria

- [x] Skill captures file modification events (create, edit, delete)
- [x] Skill captures terminal command execution and output
- [x] Skill captures diagnostic events (errors, warnings)
- [x] Events stored as valid JSON lines in `episodes.jsonl`
- [x] 7-day TTL cleanup removes old episodes automatically
- [x] Background mode runs without blocking workspace operations
- [x] Provider facade auto-detects appropriate provider
- [x] Test coverage ≥80% for event capture logic

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - System architecture
- See: [[docs/continuous-feedback-loop-implementation-plan.md]] - Full roadmap
- Implements: [[skills/tools/capture-events/SKILL.md]] specification
