---
id: wi-026
title: CFL MVP Spike - Compose Local-First Tooling for the Control Plane
type: work-item
subtype: task
lifecycle: active
status: ready
priority: high
estimated: 20
links:
  depends_on:
    - "[[wi-001]]"
    - "[[wi-002]]"
---

## Goal

Select and document the MVP composition strategy for Nirvana's control plane while preserving local-first embedded defaults and explicitly de-scoping MVP+1 external integration depth.

## Background

Nirvana's value is the control plane: cross-channel and cross-model optimization governance, ranking policy, and human-approved promotion logic. MVP should avoid rebuilding mature ecosystems where composition is sufficient.

This spike produces the evidence-backed tool selection and interface contracts for local-first defaults across each problem space. It is decision scope only: broad external integration and multi-backend rollout depth belong to [[027_cfl_mvp_plus1_external_composition_spike]].

## Tasks

- [ ] Define the decision rubric (latency, local-first operation, portability, cost, operational burden, explainability)
- [ ] Evaluate local-first memory options
  - Embedded baseline: JSONL + SQLite
  - LlamaIndex local storage/index options
  - Mem0/OpenMemory local mode
  - Zep/Graphiti self-hosted options
  - Additional candidates discovered during research
- [ ] Evaluate orchestration/recommendation options
  - Native control-plane orchestrator in-repo
  - LlamaIndex workflows/agents
  - CrewAI
  - LangGraph and similar frameworks
- [ ] Evaluate observability/evaluation/cost options for local-first operation
  - Embedded telemetry and replay harness
  - OpenAI Evals API integration points
  - Arize Phoenix self-hosted
  - Langfuse self-hosted
  - Helicone and similar request/cost tracing options
- [ ] Produce an MVP composition matrix with selected defaults and explicit non-goals
- [ ] Capture decisions in ADRs and map decisions to implementation work items
- [ ] Define explicit scope boundary:
  - MVP implements selected local defaults + canonical contracts
  - MVP+1 handles external integrations and deeper multi-backend rollout

## Deliverables

1. MVP composition decision matrix by problem space
2. Selected default components for local-first operation
3. Adapter contracts for memory, orchestration, and telemetry/evals
4. ADRs documenting selected stack and rejected alternatives
5. Updated backlog dependencies for implementation phases
6. Written scope-boundary note separating MVP and MVP+1 responsibilities

## Acceptance Criteria

- [ ] At least 3 options evaluated per problem space with evidence links
- [ ] LlamaIndex and CrewAI explicitly evaluated in scope
- [ ] Selected MVP defaults run without mandatory external services
- [ ] ADR set approved for memory, orchestration, and telemetry/evals composition
- [ ] Implementation backlog updated to reflect selected composition boundaries
- [ ] `wi-003` scope is narrowed to selected MVP defaults and contract tests only
- [ ] Deferred external/multi-backend depth is linked to [[027_cfl_mvp_plus1_external_composition_spike]]

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - Control plane scope
- See: [[docs/how-to/continuous-feedback-loop-implementation-plan.md]] - MVP delivery model
- See: [[003_cfl_phase1_memory_layer]] - Memory implementation dependency
- See: [[027_cfl_mvp_plus1_external_composition_spike]] - MVP+1 external composition scope
