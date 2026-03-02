---
id: wi-012
title: CFL Phase 6 - Compose GitHub Copilot Provider Integration (MVP+1)
type: work-item
subtype: task
lifecycle: active
status: ready
priority: high
estimated: 24
links:
  depends_on:
    - "[[wi-001]]"
    - "[[wi-027]]"
---

## Goal

Implement GitHub Copilot integration through the composition contracts selected for MVP+1 while preserving local-first fallback behavior.

## Background

Copilot is part of the external integration wave (MVP+1). The goal is to compose vendor-specific context into Nirvana's canonical control-plane schema rather than building brittle one-off logic.

## Tasks

- [ ] Research GitHub Copilot extension API
- [ ] Implement Copilot integration adapter extending base provider interface
- [ ] Add Copilot suggestion event capture
- [ ] Implement acceptance/rejection tracking
- [ ] Add inline completion pattern detection
- [ ] Create Copilot-specific event schema extensions
- [ ] Map Copilot events into canonical control-plane schema
- [ ] Implement provider auto-detection for Copilot
- [ ] Add Copilot-specific optimizations
- [ ] Create Copilot provider tests

## Deliverables

1. Copilot integration adapter implementation
2. Suggestion event capture
3. Acceptance/rejection tracking
4. Copilot event schema extensions
5. Auto-detection integration
6. Copilot-specific optimizations
7. Test suite for Copilot provider

## Acceptance Criteria

- [ ] Copilot provider activates when Copilot extension detected
- [ ] Suggestion events captured with full context
- [ ] Acceptance/rejection tracked per suggestion
- [ ] Copilot-specific patterns detected (e.g., frequently rejected patterns)
- [ ] Provider falls back to universal if Copilot unavailable
- [ ] Copilot events normalize to canonical control-plane schema
- [ ] Performance overhead < 50ms per suggestion
- [ ] Test coverage ≥75% for Copilot provider

## Related Work

- See: [[001_cfl_phase0_extension_scaffolding]] - Provider infrastructure
- See: [[027_cfl_mvp_plus1_external_composition_spike]] - MVP+1 composition contracts
- See: [[skills/tools/capture-events/SKILL.md]] - Provider matrix
- See: [[docs/architecture/continuous-feedback-loop.md]] - Multi-provider support
