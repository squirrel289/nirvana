---
id: wi-006
title: CFL Phase 3 - Work Item Finalization Triggers
type: work-item
subtype: task
lifecycle: active
status: ready
priority: high
estimated: 24
links:
  depends_on:
    - "[[wi-005]]"
---

## Goal

Automatically trigger skill proposal generation when work items transition to "done" or "completed" state, integrating CFL with PAX work management lifecycle.

## Background

Work item completion is a high-signal event for skill evolution. The patterns and workflows used to complete the work item may be valuable for automation. The CFL should analyze recent memory when work items finalize and generate proposals if patterns are detected.

## Tasks

- [ ] Implement work item state change detector
- [ ] Add work item completion event to capture-events
- [ ] Create automatic proposal trigger on work item finalization
- [ ] Implement lookback window (analyze last N days of memory)
- [ ] Add work item context to pattern analysis
- [ ] Integrate with WORK_MANAGEMENT_INTEGRATION.md conventions
- [ ] Create proposal template for work-item-triggered recommendations
- [ ] Add configuration for auto-trigger thresholds

## Deliverables

1. Work item state change detection
2. Completion event capture
3. Automatic proposal trigger workflow
4. Lookback window analysis (default: 7 days)
5. Work item context enrichment
6. Integration with [[docs/WORK_MANAGEMENT_INTEGRATION.md]]
7. Test suite for trigger logic

## Acceptance Criteria

- [ ] Work item completion detected automatically
- [ ] Completion events captured with work item metadata
- [ ] Proposals generated within 1 minute of completion
- [ ] Lookback window analyzes relevant memory only
- [ ] Work item context included in recommendations
- [ ] Configuration allows enabling/disabling auto-triggers
- [ ] Test coverage ≥75% for trigger logic

## Related Work

- See: [[docs/WORK_MANAGEMENT_INTEGRATION.md]] - Work item integration
- See: [[005_cfl_phase2_skill_creator_integration]] - Proposal generation
- See: [[docs/architecture/continuous-feedback-loop.md]] - Integration points
