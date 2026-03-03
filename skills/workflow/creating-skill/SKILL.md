---
name: creating-skill
description: Generate recommendation proposals from observed patterns and delegate approved proposals to skill-creator.
---

# Creating Skill Workflow (CFL Phase 2)

## Purpose

Implement Nirvana's control-plane recommendation workflow without autonomous skill creation.

## Inputs

- Pattern summary (`pattern_id`, occurrences, channels, model cohorts)
- Optional memory query embedding for similarity lookup
- Optional skill catalog summaries for overlap search
- Optional telemetry/eval metrics for efficiency evidence
- Interaction mode (`yolo` or `collaborative`)

## Workflow Phases

1. **Input**: Validate pattern payload and interaction mode.
2. **Search**: Query memory similarity and skill-catalog overlap.
3. **Analyze**: Compute routing decision and confidence score.
4. **Recommend**: Build summary/detail/evidence tiers.
5. **Store Proposal**: Persist recommendation in procedural memory (`proposals.json`) with `pending` status.
6. **Delegate**: Allow `skill-creator` invocation only after explicit approval.

## Routing Matrix

- `enhance_existing`: overlap with existing skill >= 0.70.
- `create_global_skill`: reusable cross-project pattern without strong overlap.
- `create_project_skill`: workspace-specific pattern.
- `update_aspect`: cross-cutting behavioral concern.
- `update_agents`: agent routing/delegation concern.

## Interaction Modes

- `yolo`: auto-generate recommendation payload without prompt.
- `collaborative`: include explicit human review prompt before delegation.

## Proposal Lifecycle

- `pending`: created from recommendation, awaiting review.
- `approved`: review accepted, eligible for `skill-creator` handoff.
- `rejected`: archived with rationale, used for learning signals.
- `implemented`: approved proposal executed and linked to implementation reference.

## Non-Goals

- No direct skill creation or modification.
- No bypass of human approval.
