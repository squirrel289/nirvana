---
"$schema": https://raw.githubusercontent.com/templjs/templ.js/main/schemas/frontmatter/by-type/document/current.json
title: Work Management Integration Conventions
lifecycle: active
created: 2026-03-03
audience: PAX contributors
---

Conventions used by CFL Phase 3 work-item automation.

## Event Contract

Work-item completion events use this shape:

- `event_type`: `work_item.completed`
- `metadata.workItemId`: work item identifier (for example `wi-006`)
- `metadata.previousStatus`: status before transition
- `metadata.currentStatus`: status after transition
- `metadata.path`: backlog markdown path
- `metadata.detectedAt`: ISO timestamp when trigger detected completion

## Lifecycle Mapping

The trigger treats these states as completion outcomes:

- `closed`
- `completed`
- `done`

## Trigger Defaults

- Lookback window: 7 days
- Minimum occurrences for auto-proposal: 3
- Default interaction mode: `collaborative`
- Delegation policy: `skill-creator` only, approval required before handoff

## Proposal Persistence

Work-item-triggered proposals are persisted in procedural memory as `proposals.json` records with lifecycle states:

- `pending`
- `approved`
- `rejected`
- `implemented`
