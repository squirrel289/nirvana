---
id: wi-007
title: CFL Phase 3 - PR Feedback Integration
type: work-item
subtype: task
lifecycle: active
status: ready-for-review
priority: high
estimated: 24
actual: 3
assignee: ""
test_results:
  - timestamp: 2026-03-04T00:00:00.000Z
    note: "pnpm test -- src/packages/core/src/recommendations/pr-feedback.test.ts (6 tests passed)"
  - timestamp: 2026-03-04T00:00:00.000Z
    note: "pnpm test -- src/packages/core/src/recommendations/*.test.ts (28 tests passed)"
  - timestamp: 2026-03-04T00:00:00.000Z
    note: "pnpm test:coverage -- src/packages/core/src/recommendations/*.test.ts (`recommendations/` statements 85.95%, `pr-feedback.ts` statements 87.96%)"
notes:
  - timestamp: 2026-03-04T00:00:00.000Z
    note: "Implemented `pr-feedback` module for GitHub PR comment/review capture via `gh`, category classification, recurring-pattern detection, high-weight signal generation, proposal mapping, and acknowledgment tracking."
  - timestamp: 2026-03-04T00:00:00.000Z
    note: "Updated `docs/WORK_MANAGEMENT_INTEGRATION.md` with `pr.feedback.captured` event conventions, classification schema, recurrence threshold, and signal-weight defaults."
  - timestamp: 2026-03-04T00:00:00.000Z
    note: "Moved to ready-for-review after passing PR-feedback unit tests, recommendation-suite tests, and coverage gate >=75%."
links:
  depends_on:
    - "[[wi-002]]"
    - "[[wi-005]]"
---

## Goal

Capture PR feedback (comments, suggestions, rejections) as high-value signals for skill evolution, enabling the CFL to learn from code review patterns.

## Background

PR feedback represents expert validation of code quality and patterns. Recurring feedback themes (e.g., "add error handling", "use const instead of let") are strong candidates for skill creation or enhancement. The CFL should capture and analyze PR feedback as a privileged signal.

## Tasks

- [x] Implement PR feedback event capture (comments, reviews, suggestions)
- [x] Add GitHub integration for PR comment retrieval
- [x] Create feedback classification (style, logic, testing, documentation)
- [x] Implement recurring feedback pattern detection
- [x] Add PR feedback to signal catalog as high-weight signals
- [x] Create feedback→skill proposal mapping
- [x] Add PR context to recommendations (link to original feedback)
- [x] Implement feedback acknowledgment tracking

## Deliverables

1. PR feedback event capture integration
2. GitHub API integration for PR data
3. Feedback classification system
4. Recurring feedback pattern detector
5. High-weight signal creation from feedback
6. Feedback→proposal mapping
7. Test suite for feedback capture and analysis

## Acceptance Criteria

- [x] PR comments captured as events
- [x] Feedback classified into categories (style, logic, etc.)
- [x] Recurring feedback detected (≥3 occurrences across PRs)
- [x] High-weight signals created from feedback patterns
- [x] Proposals link back to original PR feedback
- [x] Feedback acknowledgment tracked (did proposal prevent future feedback?)
- [x] Test coverage ≥75% for feedback capture

## Related Work

- See: [[docs/WORK_MANAGEMENT_INTEGRATION.md]] - PR integration
- See: [[002_cfl_phase1_capture_events_skill]] - Event capture
- See: [[docs/architecture/continuous-feedback-loop.md]] - Signal catalog
