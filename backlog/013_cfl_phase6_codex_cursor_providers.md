---
id: wi-013
title: CFL Phase 6 - Compose Codex and Cursor Integrations (MVP+1)
type: work-item
subtype: task
lifecycle: active
status: ready
priority: high
estimated: 48
links:
  depends_on:
    - "[[wi-001]]"
    - "[[wi-012]]"
    - "[[wi-027]]"
---

## Goal

Implement Codex and Cursor integrations via MVP+1 composition contracts and normalize signals into the control-plane schema.

## Background

Codex (API-based) and Cursor (extension-based) remain key providers, but implementation must follow composition-first boundaries selected in MVP+1 spikes instead of hard-coding bespoke pipelines.

## Tasks

### Codex Provider

- [ ] Research OpenAI Codex API for event exposure
- [ ] Implement Codex integration adapter with API polling
- [ ] Add request/response event capture
- [ ] Implement API rate limiting and backoff
- [ ] Create Codex-specific event schema

### Cursor Provider

- [ ] Research Cursor extension API
- [ ] Implement Cursor integration adapter extending base interface
- [ ] Add Cursor-specific event capture
- [ ] Implement Cursor's multi-model tracking
- [ ] Create Cursor-specific optimizations

### Integration

- [ ] Update provider auto-detection for Codex and Cursor
- [ ] Add provider priority logic (prefer native over API)
- [ ] Create unified event normalization across all providers
- [ ] Implement provider health monitoring
- [ ] Add provider performance comparison analytics

## Deliverables

1. Codex integration adapter implementation
2. Cursor integration adapter implementation
3. Provider auto-detection updates
4. Provider priority logic
5. Cross-provider event normalization
6. Provider health monitoring
7. Performance comparison analytics
8. Test suites for both providers

## Acceptance Criteria

- [ ] Codex provider captures API request/response events
- [ ] Cursor provider captures Cursor-specific events
- [ ] Auto-detection selects appropriate provider
- [ ] All providers normalize to consistent event schema
- [ ] Provider health monitored (uptime, error rates)
- [ ] Performance comparison data available
- [ ] Graceful fallback if provider unavailable
- [ ] Test coverage ≥75% for each provider

## Related Work

- See: [[012_cfl_phase6_copilot_provider]] - Copilot provider reference
- See: [[001_cfl_phase0_extension_scaffolding]] - Provider infrastructure
- See: [[027_cfl_mvp_plus1_external_composition_spike]] - MVP+1 composition contracts
- See: [[docs/architecture/continuous-feedback-loop.md]] - Provider matrix
