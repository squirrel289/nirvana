---
"$schema": https://raw.githubusercontent.com/templjs/templ.js/main/schemas/frontmatter/by-type/document/current.json
title: CFL ADR Set - MVP Composition Decisions
lifecycle: active
type: document
subtype: adr
status: approved
status_comment: ADR set reviewed as one unit and approved; ADR-002/003/004 are accepted as the MVP composition baseline for `wi-026` and consumed by implementation planning in `wi-003`.
created: 2026-03-02
approved_on: 2026-03-02
approved_by: Nirvana maintainers
audience: PAX contributors
---

## Purpose

Define the ADR set for `wi-026` and track approval state explicitly.

This set is also the decision baseline consumed by `wi-003` for memory implementation scope.

## ADR Set Members

1. `cfl-adr-002-mvp-memory-composition.md`
2. `cfl-adr-003-mvp-orchestration-composition.md`
3. `cfl-adr-004-mvp-telemetry-eval-cost-composition.md`

## Alignment to Work Items

1. `wi-026` defines MVP local-first composition boundaries and explicit MVP+1 de-scope.
2. `wi-003` consumes ADR-002 memory decisions for canonical contracts, local adapters, and conformance/benchmark expectations.
3. `wi-004` consumes ADR-003 orchestration runtime ownership boundaries.
4. `wi-008` consumes ADR-004 telemetry/evals/cost governance boundaries.

## Approval Gate

The `wi-026` acceptance criterion "ADR set approved for memory, orchestration, and telemetry/evals composition" is satisfied once explicit approval is recorded.

To satisfy approval:

1. Review all three ADRs together as one set.
2. Record approver and approval date in this document.
3. Update each ADR status consistently.
