---
"$schema": https://raw.githubusercontent.com/templjs/templ.js/main/schemas/frontmatter/by-type/document/current.json
title: CFL MVP Composition Selection Matrix
lifecycle: active
created: 2026-03-02
audience: PAX contributors
---

Evidence-backed selection matrix for `wi-026` (`CFL MVP Spike - Compose Local-First Tooling for the Control Plane`).

## Decision Rubric

Weighted criteria for MVP selection:

| Criterion | Weight | Definition |
| --- | --- | --- |
| local_first_operability | 30% | Runs without required cloud services |
| integration_complexity | 20% | Engineering effort to adopt and maintain |
| observability_governance_fit | 15% | Supports Nirvana control-plane policy and audit evidence |
| portability_lock_in_risk | 15% | Data/model portability and adapter flexibility |
| performance_latency | 10% | Runtime and interactive overhead |
| cost_operational_burden | 10% | Infrastructure and maintenance burden |

Scoring scale: `1` (poor) to `5` (strong).  
MVP selection threshold: prefer local defaults with overall score `>= 3.8` and no hard blocker on `local_first_operability`.

## Problem Space A: Memory Substrate

| Option | local_first_operability | integration_complexity | portability_lock_in_risk | Weighted Score | Notes |
| --- | --- | --- | --- | --- | --- |
| Embedded JSONL + SQLite (default) | 5 | 5 | 5 | 4.8 | No external dependency, simplest migration baseline |
| LlamaIndex local storage/index mode | 4 | 3 | 4 | 3.8 | Useful abstraction layer, still adds framework overhead |
| Mem0/OpenMemory local mode | 4 | 3 | 3 | 3.5 | Strong memory primitives, needs adapter normalization |
| Zep/Graphiti self-hosted | 3 | 2 | 3 | 2.8 | Better fit for MVP+1 externalized knowledge graph |

MVP default selection: **Embedded JSONL + SQLite**  
MVP+1 target composition: **LlamaIndex and/or Mem0/Zep adapters via `wi-027`**

Evidence links:

- https://docs.llamaindex.ai/
- https://docs.mem0.ai/openmemory/overview
- https://help.getzep.com/overview

## Problem Space B: Orchestration and Recommendation Runtime

| Option | local_first_operability | integration_complexity | observability_governance_fit | Weighted Score | Notes |
| --- | --- | --- | --- | --- | --- |
| In-repo control-plane orchestrator (default) | 5 | 4 | 5 | 4.5 | Keeps ranking/policy semantics fully owned by Nirvana |
| LlamaIndex workflows/agents | 4 | 3 | 3 | 3.4 | Good composition candidate but policy layer should remain local |
| CrewAI | 4 | 3 | 3 | 3.3 | Multi-agent utility, better as composed runtime adapter |
| LangGraph | 4 | 3 | 3 | 3.4 | Durable workflow tooling, useful for MVP+1 runtime options |

MVP default selection: **In-repo control-plane orchestrator**  
MVP+1 target composition: **LlamaIndex/CrewAI/LangGraph adapters where beneficial**

Evidence links:

- https://docs.llamaindex.ai/
- https://docs.crewai.com/
- https://docs.langchain.com/oss/python/langgraph/overview

## Problem Space C: Observability, Evals, and Cost

| Option | local_first_operability | integration_complexity | observability_governance_fit | Weighted Score | Notes |
| --- | --- | --- | --- | --- | --- |
| Embedded telemetry + replay harness (default) | 5 | 4 | 5 | 4.4 | Required for MVP local-first guarantees |
| OpenAI Evals API integration points | 3 | 3 | 4 | 3.2 | Valuable for later comparative eval automation |
| Arize Phoenix self-hosted | 4 | 3 | 4 | 3.7 | Strong candidate for MVP+1 composition |
| Langfuse self-hosted | 4 | 3 | 4 | 3.7 | Strong candidate for MVP+1 composition |
| Helicone | 3 | 3 | 3 | 3.0 | Strong cost visibility, weaker local-only default fit |

MVP default selection: **Embedded telemetry + replay harness**  
MVP+1 target composition: **Phoenix/Langfuse + selective Evals/Helicone integration**

Evidence links:

- https://arize.com/docs/phoenix
- https://langfuse.com/docs
- https://developers.openai.com/api/reference/resources/evals
- https://docs.helicone.ai/

## MVP Selections

1. Memory: Embedded JSONL + SQLite.
2. Orchestration: In-repo control-plane runtime.
3. Observability/evals/cost: Embedded telemetry and replay harness.

These defaults preserve local-first operation with no mandatory external service dependencies.

## MVP Non-Goals

1. Full multi-backend rollout in MVP.
2. Mandatory hosted observability/evals infrastructure.
3. Outsourcing recommendation/ranking policy to third-party runtimes.

These are explicitly deferred to `wi-027`.

## Mapping to Backlog

1. `wi-003` implements selected local memory defaults plus canonical contracts.
2. `wi-004` implements control-plane recommendation workflow over canonical contracts.
3. `wi-008` implements canonical metric schema and ROI governance over local telemetry.
4. `wi-027` owns comprehensive external composition rollout depth.
