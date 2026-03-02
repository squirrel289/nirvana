---
"$schema": https://raw.githubusercontent.com/templjs/templ.js/main/schemas/frontmatter/by-type/document/current.json
title: CFL ADR 003 - MVP Orchestration and Recommendation Runtime Composition
lifecycle: active
type: document
subtype: adr
status: approved
status_comment: Accepted for MVP implementation planning and execution (`wi-026`, approved 2026-03-02).
created: 2026-03-02
audience: PAX contributors
---

## Context

Nirvana's primary value is control-plane policy ownership (ranking, governance, human approval workflows). Orchestration frameworks can accelerate implementation but can also dilute policy control if adopted as core decision engines.

## Decision

1. MVP uses an in-repo control-plane orchestrator as system of record for recommendation policy.
2. LlamaIndex, CrewAI, LangGraph, and similar runtimes are treated as optional composed adapters for MVP+1+.
3. MVP orchestration must integrate through canonical contracts owned in-repo (including memory and recommendation evidence interfaces) rather than framework-native policy semantics.
4. Any composed runtime must emit canonical recommendation evidence fields and respect Nirvana policy gates.

## Consequences

Positive:

1. Preserves policy determinism and explainability in MVP.
2. Avoids tight coupling to one orchestration framework.
3. Enables gradual adoption of external runtimes without rewrite.

Trade-offs:

1. More internal orchestration code in MVP.
2. Adapter design burden shifts to MVP+1 planning and Phase 6.

## Rejected Alternatives

1. Immediate framework-first runtime replacement in MVP.
2. Delegating recommendation ranking policy to third-party agent framework defaults.

## References

1. [CFL MVP Composition Selection Matrix](../how-to/cfl-mvp-composition-selection-matrix.md)
2. [CFL MVP vs MVP+1 Scope Boundary](../how-to/cfl-mvp-vs-mvp-plus1-scope-boundary.md)
3. `wi-004`, `wi-026`, `wi-027`
