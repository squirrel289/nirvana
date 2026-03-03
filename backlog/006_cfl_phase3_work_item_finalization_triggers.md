---
id: wi-006
title: CFL Phase 3 - Work Item Finalization Triggers
type: work-item
subtype: task
lifecycle: active
status: ready-for-review
priority: high
estimated: 24
actual: 3
assignee: ""
test_results:
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "pnpm test -- src/packages/core/src/recommendations/work-item-finalization.test.ts src/extensions/vscode/src/providers/universal.test.ts (11 tests passed)"
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "pnpm test -- src/packages/core/src/recommendations/*.test.ts src/extensions/vscode/src/providers/universal.test.ts (26 tests passed)"
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "pnpm test:coverage -- src/packages/core/src/recommendations/*.test.ts (`recommendations/` statements 85.08%, `work-item-finalization.ts` statements 83.82%)"
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "pnpm run lint:frontmatter -- backlog/006_cfl_phase3_work_item_finalization_triggers.md and pnpm run lint:frontmatter (schema validation passed)"
notes:
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "Implemented `work-item-finalization` trigger module with completion-transition detection, configurable lookback/thresholds, contextual channel/model enrichment, and proposal template rendering."
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "Integrated completion-event capture in VS Code universal provider (`work_item.completed`) with frontmatter status transition detection and metadata contract aligned to `docs/WORK_MANAGEMENT_INTEGRATION.md`."
  - timestamp: 2026-03-03T00:00:00.000Z
    note: "Moved to ready-for-review after passing trigger/provider tests, recommendation-suite tests, coverage gate (>=75%), and frontmatter schema validation."
links:
  depends_on:
    - "[[wi-005]]"
---

## Goal

Automatically trigger skill proposal generation when work items transition to "done" or "completed" state, integrating CFL with PAX work management lifecycle.

## Background

Work item completion is a high-signal event for skill evolution. The patterns and workflows used to complete the work item may be valuable for automation. The CFL should analyze recent memory when work items finalize and generate proposals if patterns are detected.

## Tasks

- [x] Implement work item state change detector
- [x] Add work item completion event to capture-events
- [x] Create automatic proposal trigger on work item finalization
- [x] Implement lookback window (analyze last N days of memory)
- [x] Add work item context to pattern analysis
- [x] Integrate with WORK_MANAGEMENT_INTEGRATION.md conventions
- [x] Create proposal template for work-item-triggered recommendations
- [x] Add configuration for auto-trigger thresholds

## Deliverables

1. Work item state change detection
2. Completion event capture
3. Automatic proposal trigger workflow
4. Lookback window analysis (default: 7 days)
5. Work item context enrichment
6. Integration with [[docs/WORK_MANAGEMENT_INTEGRATION.md]]
7. Test suite for trigger logic

## Acceptance Criteria

- [x] Work item completion detected automatically
- [x] Completion events captured with work item metadata
- [x] Proposals generated within 1 minute of completion
- [x] Lookback window analyzes relevant memory only
- [x] Work item context included in recommendations
- [x] Configuration allows enabling/disabling auto-triggers
- [x] Test coverage ≥75% for trigger logic

## Related Work

- See: [[docs/WORK_MANAGEMENT_INTEGRATION.md]] - Work item integration
- See: [[005_cfl_phase2_skill_creator_integration]] - Proposal generation
- See: [[docs/architecture/continuous-feedback-loop.md]] - Integration points
