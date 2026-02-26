---
id: wi-013
title: CFL Phase 6 - Implement Codex and Cursor Providers
status: not-started
priority: low
complexity: high
estimated_hours: 48
dependencies: [wi-001, wi-012]
created: 2026-02-26
---

## Goal

Implement Codex and Cursor provider integrations to complete multi-assistant support for the CFL.

## Background

Codex (API-based) and Cursor (extension-based) require different integration approaches. Codex provider uses API polling and request/response analysis. Cursor provider integrates with Cursor's extension API similar to Copilot but with Cursor-specific features.

## Tasks

### Codex Provider

- [ ] Research OpenAI Codex API for event exposure
- [ ] Implement Codex provider with API polling
- [ ] Add request/response event capture
- [ ] Implement API rate limiting and backoff
- [ ] Create Codex-specific event schema

### Cursor Provider

- [ ] Research Cursor extension API
- [ ] Implement Cursor provider extending base interface
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

1. Codex provider implementation
2. Cursor provider implementation
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
- See: [[docs/architecture/continuous-feedback-loop.md]] - Provider matrix
