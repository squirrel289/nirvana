---
"$schema": https://raw.githubusercontent.com/templjs/templ.js/main/schemas/frontmatter/by-type/document/current.json
title: CFL MVP vs MVP+1 Scope Boundary
lifecycle: active
created: 2026-03-02
audience: PAX contributors
---

Scope boundary note for `wi-026` and `wi-027`.

## Purpose

Prevent duplicate work across Phase 1 (`wi-003`) and MVP+1 expansion by defining explicit ownership boundaries.

## MVP Scope (Owned by wi-026 + wi-003 + wi-004 + wi-008)

1. Local-first embedded defaults for memory and telemetry.
2. Canonical control-plane contracts (memory, runtime, metric schemas).
3. In-repo recommendation/ranking policy execution.
4. Conformance tests for selected MVP default implementations.
5. Documentation of deferred external integration depth.

## MVP+1 Scope (Owned by wi-027 + Phase 6 items)

1. External provider composition rollout for memory/orchestration/observability/evals/cost.
2. Multi-backend depth decisions (how many backends per domain and sequence).
3. Migration waves from local defaults to composed providers.
4. Outage/fallback reliability model for each integrated provider class.
5. Governance and portability controls for externalized deployments.

## Explicit De-scope Rules

1. MVP work must not require cloud services to function.
2. MVP work must not implement broad external-provider feature parity.
3. MVP+1 work must not move control-plane policy ownership out of Nirvana.

## Handoff Contract

Artifacts produced by MVP and consumed by MVP+1:

1. Canonical memory contract and conformance harness.
2. Canonical telemetry/eval metric schema.
3. Baseline local replay datasets and benchmark scripts.
4. ADR references selecting local defaults and naming deferred external options.
