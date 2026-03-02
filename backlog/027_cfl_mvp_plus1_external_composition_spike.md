---
id: wi-027
title: CFL MVP+1 Spike - External Provider Composition and Integration Contracts
type: work-item
subtype: task
lifecycle: active
status: ready
priority: high
estimated: 24
links:
  depends_on:
    - "[[wi-026]]"
    - "[[wi-003]]"
    - "[[wi-004]]"
---

## Goal

Select and document the MVP+1 external provider composition strategy so Nirvana can integrate mature hosted ecosystems without compromising control-plane policy ownership, and own the rollout depth deferred from MVP.

## Background

After MVP local-first defaults are stable, MVP+1 expands into deep external integrations. This spike defines provider selection, adapter contracts, and governance controls across memory, orchestration, observability, evals, and cost tracking.

## Tasks

- [ ] Define MVP+1 external integration criteria
  - Security/compliance model
  - Multi-tenant readiness
  - Reliability/SLOs
  - Data portability and lock-in controls
- [ ] Evaluate external observability/evaluation/cost providers
  - Langfuse Cloud
  - LangSmith
  - W&B Weave
  - AgentOps
  - Helicone
  - OpenAI Evals and GitHub Models eval workflows
  - Additional similar options discovered during research
- [ ] Evaluate external memory providers
  - Mem0 managed offerings
  - Zep/Graphiti managed offerings
  - LlamaIndex managed/LlamaCloud capabilities
  - Additional similar options discovered during research
- [ ] Evaluate orchestration platform options
  - CrewAI managed/enterprise capabilities
  - LlamaIndex workflow/agent platform capabilities
  - LangGraph platform and similar options
- [ ] Define adapter contracts and migration plan from MVP local defaults
- [ ] Define multi-backend rollout depth deferred from MVP
  - Number of production backends per problem space
  - Minimum conformance coverage for each added backend
  - Sequencing of migration waves by risk and value
- [ ] Produce failover model (external outage fallback to local-first embedded mode)
- [ ] Document recommended MVP+1 composition profile with phased rollout plan

## Deliverables

1. MVP+1 provider selection matrix with weighted scoring
2. External integration contracts for each problem space
3. Data governance and portability policy for composed providers
4. Rollout and fallback architecture from local defaults to external composition
5. ADRs for selected external provider set
6. MVP+1 expansion plan for multi-backend coverage and migration depth

## Acceptance Criteria

- [ ] At least 3 external candidates evaluated per problem space with evidence links
- [ ] LlamaIndex and CrewAI explicitly evaluated in MVP+1 scope
- [ ] Control-plane policy logic remains in Nirvana and is not outsourced
- [ ] Local-first fallback path validated for each selected provider category
- [ ] Backlog sequencing updated for MVP+1 integration implementation
- [ ] Multi-backend rollout depth is explicitly defined and linked from [[003_cfl_phase1_memory_layer]]

## Related Work

- See: [[docs/architecture/continuous-feedback-loop.md]] - Composition boundaries
- See: [[docs/how-to/continuous-feedback-loop-implementation-plan.md]] - MVP+1 scope
- See: [[012_cfl_phase6_copilot_provider]] - Provider integration work
- See: [[013_cfl_phase6_codex_cursor_providers]] - Multi-provider integration work
