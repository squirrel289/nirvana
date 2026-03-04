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

## PR Feedback Event Contract

PR feedback capture events use this shape:

- `event_type`: `pr.feedback.captured`
- `metadata.prNumber`: pull request number
- `metadata.prUrl`: pull request URL
- `metadata.feedbackUrl`: specific comment/review URL
- `metadata.category`: `style | logic | testing | documentation | other`
- `metadata.kind`: `comment | review | suggestion`
- `metadata.author`: reviewer login
- `metadata.detectedAt`: ISO timestamp when feedback was captured

Recurring-pattern keying defaults:

- Minimum recurrence threshold: 3 feedback events
- Recurrence scope: must span at least 2 distinct pull requests
- Signal weight: 1.5 (high-weight signal class)

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
