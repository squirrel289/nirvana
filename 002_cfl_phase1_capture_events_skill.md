---
id: wi-002
title: CFL Phase 1 - Implement capture-events Skill
status: not-started
priority: high
complexity: high
estimated_hours: 40
dependencies: [wi-001]
created: 2026-02-26
---

## Goal

Implement the `capture-events` skill with provider adapters (Universal, Copilot, Codex, Cursor) to capture workspace signals into standardized event format.

## Background

The capture-events skill is the input layer of the CFL. It abstracts workspace signals (file modifications, terminal commands, diagnostics, skill invocations) into standardized JSON events stored in `.vscode/pax-memory/episodes.jsonl`.

Following PAX's assistant-agnostic philosophy, the skill uses a facade pattern to delegate to provider-specific adapters while maintaining a consistent API.

## Tasks

- [ ] Implement `skills/tools/capture-events/SKILL.md` as executable skill
- [ ] Create event schema with timestamp, provider, event_type, metadata
- [ ] Implement universal provider event capture:
  - File watcher integration (create, modify, delete)
  - Terminal output parser (commands, errors, success)
  - Diagnostic collector (errors, warnings, info)
  - Skill invocation tracker
- [ ] Implement provider facade with auto-detection logic
- [ ] Add background mode (continuous capture) and on-demand mode
- [ ] Implement JSONL append-only storage to `episodes.jsonl`
- [ ] Add 7-day TTL cleanup for episodic memory
- [ ] Create unit tests for event capture and storage

## Deliverables

1. Executable `capture-events` skill in `skills/tools/capture-events/`
2. Event schema definition and validation
3. Universal provider implementation with full workspace coverage
4. Provider facade with auto-detection
5. JSONL storage handler with TTL management
6. Test suite validating all event types

## Acceptance Criteria

- [ ] Skill captures file modification events (create, edit, delete)
- [ ] Skill captures terminal command execution and output
- [ ] Skill captures diagnostic events (errors, warnings)
- [ ] Events stored as valid JSON lines in `episodes.jsonl`
- [ ] 7-day TTL cleanup removes old episodes automatically
- [ ] Background mode runs without blocking workspace operations
- [ ] Provider facade auto-detects appropriate provider
- [ ] Test coverage ≥80% for event capture logic

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - System architecture
- See: [[docs/continuous-feedback-loop-implementation-plan.md]] - Full roadmap
- Implements: [[skills/tools/capture-events/SKILL.md]] specification
