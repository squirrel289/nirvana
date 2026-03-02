---
"$schema": https://raw.githubusercontent.com/templjs/templ.js/main/schemas/frontmatter/by-type/document/current.json
title: CFL ADR 004 - MVP Telemetry, Evals, and Cost Composition Strategy
lifecycle: active
created: 2026-03-02
audience: PAX contributors
---

## Status

Approved for MVP implementation planning; pending ADR-set approval gate in `wi-026`.

## Context

Nirvana requires metric governance for token/context/request/time and ROI forecast-vs-realized tracking. External observability/eval/cost products are valuable but must not be required for MVP baseline functionality.

## Decision

1. MVP default is embedded telemetry and replay harness with canonical metric schema.
2. ROI and quality governance calculations remain in Nirvana control-plane logic.
3. External providers (for example Langfuse, Phoenix, OpenAI Evals, Helicone) are composed in MVP+1 behind canonical adapter contracts.
4. Local-first fallback must remain available for every external provider path.
5. Any external integration must preserve comparability of forecast-vs-realized ROI metrics against the local baseline.

## Consequences

Positive:

1. MVP remains operable in offline/local environments.
2. Governance semantics remain consistent across provider changes.
3. External integrations can be added iteratively without blocking core delivery.

Trade-offs:

1. Some observability dashboards and managed eval workflows arrive in MVP+1.
2. Requires careful adapter and schema design to avoid drift.

## Rejected Alternatives

1. Making hosted telemetry/eval services mandatory in MVP.
2. Binding metric schema directly to one vendor's data model.

## References

1. [CFL MVP Composition Selection Matrix](../how-to/cfl-mvp-composition-selection-matrix.md)
2. [CFL MVP vs MVP+1 Scope Boundary](../how-to/cfl-mvp-vs-mvp-plus1-scope-boundary.md)
3. `wi-008`, `wi-026`, `wi-027`
