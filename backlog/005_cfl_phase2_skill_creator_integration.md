---
id: wi-005
title: CFL Phase 2 - Integrate with skill-creator Delegation
type: work-item
subtype: task
lifecycle: active
status: ready
priority: high
estimated: 24
links:
  depends_on:
    - "[[wi-004]]"
---

## Goal

Integrate creating-skill workflow with skill-creator delegation pattern, ensuring human-in-the-loop approval for all skill creation and storing proposals in procedural memory.

## Background

PAX requires explicit skill-creator delegation for all skill creation (never autonomous). The CFL must respect this convention by generating proposals that require human approval before promotion to executable skills.

## Tasks

- [ ] Implement skill-creator delegation interface
- [ ] Create proposal storage schema in procedural memory
- [ ] Add proposal lifecycle states (pending, approved, rejected, implemented)
- [ ] Implement approval workflow (interactive prompt or configuration)
- [ ] Add skill-creator parameter mapping from recommendations
- [ ] Create proposal review interface (CLI or VS Code webview)
- [ ] Implement proposal→skill-creator handoff
- [ ] Add proposal tracking and analytics

## Deliverables

1. skill-creator delegation interface
2. Proposal storage in `proposals.json` (procedural memory)
3. Proposal lifecycle state machine
4. Approval workflow (human-in-the-loop)
5. Parameter mapping for skill-creator
6. Proposal review interface
7. Test suite for delegation and approval logic

## Acceptance Criteria

- [ ] Recommendations stored as proposals (never auto-executed)
- [ ] Proposals include full skill-creator parameters
- [ ] Human approval required before skill-creator invocation
- [ ] Approved proposals delegated to skill-creator correctly
- [ ] Rejected proposals marked and logged (learning signal)
- [ ] Proposal review interface shows rationale and evidence
- [ ] Proposal analytics track approval rates by type
- [ ] Test coverage ≥80% for delegation logic

## Related Work

- See: [[004_cfl_phase2_creating_skill_workflow]] - Recommendation generation
- Delegates to: skill-creator (PAX mandatory pattern)
- See: [[docs/architecture/continuous-feedback-loop.md]] - Promotion workflow
