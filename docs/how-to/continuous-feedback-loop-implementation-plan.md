---
"$schema": https://raw.githubusercontent.com/templjs/templ.js/main/schemas/frontmatter/by-type/document/current.json
title: Continuous Feedback Loop Implementation Plan
lifecycle: active
created: 2026-02-26
audience: PAX contributors
---

Phased implementation roadmap for the PAX Continuous Feedback Loop (CFL), organized by milestones from MVP baseline through advanced features.

## Overview

This plan decomposes the [Continuous Feedback Loop Architecture](architecture/continuous-feedback-loop.md) into concrete, actionable work items organized by phased milestones. Each phase builds upon the previous, with clear dependencies and incremental value delivery.

**Total Estimated Effort**: 344+ hours across 17 work items

## Milestone Progression

- **MVP Baseline** (Phase 0-2): 108 hours → Functional feedback loop
- **Production Ready** (Phase 3-4): +52 hours = 160 hours → Integration + efficiency
- **Complete Loop** (Phase 5): +32 hours = 192 hours → Self-improving signals
- **Multi-Assistant** (Phase 6): +72 hours = 264 hours → Full provider support
- **Advanced Features** (Phase 7): +80 hours = 344+ hours → Future enhancements

## Phase 0: Extension Scaffolding (32 hours)

**Goal**: Establish foundational VS Code extension infrastructure

**Work Items**:

- [[001_cfl_phase0_extension_scaffolding]] - Extension scaffolding and provider infrastructure (32h)

**Deliverables**:

- VS Code extension with universal provider
- Provider facade pattern implementation
- Local storage infrastructure (`.vscode/pax-memory/`)

**Milestone**: Extension activates and captures basic workspace events

**Status**: ✅ Completed

---

## Phase 1: MVP Core - Event Capture & Memory (80 hours)

**Goal**: Implement core event capture and memory layer

**Work Items**:

- [[002_cfl_phase1_capture_events_skill]] - Implement capture-events skill (40h)
- [[003_cfl_phase1_memory_layer]] - Implement memory layer with pattern detection (40h)

**Deliverables**:

- `capture-events` skill with provider adapters
- JSONL episodic storage with 7-day TTL
- Pattern detection from episode frequency analysis
- Semantic memory tier with 30-day TTL

**Dependencies**: Phase 0 complete

**Milestone**: System captures and stores events, detects basic patterns

---

## Phase 2: Recommendation Engine (60 hours)

**Goal**: Implement skill recommendation workflow

**Work Items**:

- [[004_cfl_phase2_creating_skill_workflow]] - Implement creating-skill workflow (36h)
- [[005_cfl_phase2_skill_creator_integration]] - Integrate with skill-creator delegation (24h)

**Deliverables**:

- `creating-skill` workflow skill
- Hybrid routing matrix (enhance/create-pax/create-project/aspect/agents)
- Confidence scoring for recommendations
- skill-creator delegation with proposal storage

**Dependencies**: Phase 1 complete

**Milestone**: System generates actionable skill recommendations

---

## Phase 3: Work Management Integration (48 hours)

**Goal**: Connect CFL to work item lifecycle

**Work Items**:

- [[006_cfl_phase3_work_item_finalization_triggers]] - Auto-propose on work item completion (24h)
- [[007_cfl_phase3_pr_feedback_integration]] - Capture PR feedback as signals (24h)

**Deliverables**:

- Automatic proposal triggers on work item state transitions
- PR feedback event capture
- Integration with [[WORK_MANAGEMENT_INTEGRATION.md]]

**Dependencies**: Phase 2 complete

**Milestone**: CFL integrates with existing PAX workflows

---

## Phase 4: Efficiency Optimization (48 hours)

**Goal**: Add efficiency metrics and ROI-based prioritization

**Work Items**:

- [[008_cfl_phase4_efficiency_metrics]] - Implement LLM call tracking and ROI calculation (28h)
- [[009_cfl_phase4_skill_harvesting]] - Add frequency-weighted skill recommendations (20h)

**Deliverables**:

- LLM call counters, execution time tracking, context overhead measurement
- ROI calculation: (time_saved × frequency) / creation_cost
- Skill harvesting recommendations ranked by efficiency
- Progressive disclosure (summary/detail/evidence tiers)

**Dependencies**: Phase 2 complete

**Milestone**: Recommendations prioritized by efficiency ROI

---

## Phase 5: Performance Evaluation & Signal Evolution (64 hours)

**Goal**: Self-improving signal catalog through validation

**Work Items**:

- [[010_cfl_phase5_signal_validation]] - Implement signal performance tracking (32h)
- [[011_cfl_phase5_signal_evolution]] - Add signal promotion/retirement workflow (32h)

**Deliverables**:

- Signal performance metrics (precision, recall, false positive rate)
- Human validation capture (accept/reject/modify)
- Signal promotion from candidate → validated → proven
- Retirement criteria for low-performing signals
- Evolving signal catalog in `signals.json`

**Dependencies**: Phase 3-4 complete

**Milestone**: System learns which patterns are valuable

---

## Phase 6: Extended Provider Support (72 hours)

**Goal**: Full multi-assistant compatibility

**Work Items**:

- [[012_cfl_phase6_copilot_provider]] - Implement GitHub Copilot provider (24h)
- [[013_cfl_phase6_codex_cursor_providers]] - Implement Codex and Cursor providers (48h)

**Deliverables**:

- Copilot extension integration
- Codex API adapter
- Cursor extension integration
- Provider auto-detection logic
- Provider-specific optimization

**Dependencies**: Phase 0 complete (can run in parallel with Phase 1-5)

**Milestone**: CFL works across all major AI assistants

---

## Phase 7: Future Enhancements (80+ hours)

**Goal**: Advanced features and research directions

**Work Items**:

- [[014_cfl_phase7_aspect_detection]] - Detect aspect usage patterns (20h)
- [[015_cfl_phase7_batch_analysis]] - Batch analysis mode for historical data (24h)
- [[016_cfl_phase7_visualization_dashboard]] - Build insights dashboard (24h)
- [[017_cfl_phase7_cross_workspace_learning]] - Research cross-workspace pattern sharing (12h+)

**Deliverables**:

- Aspect composition pattern detection
- Batch analysis for existing repositories
- VS Code webview dashboard for insights
- Research spike: Privacy-preserving cross-workspace learning

**Dependencies**: Phase 5 complete

**Milestone**: Enhanced analytics and exploration

---

## Implementation Strategy

### Critical Path

1. **Phase 0** → 2. **Phase 1** → 3. **Phase 2** → 4. **Phase 3** → 5. **Phase 5**

Phases 4 and 6 can run in parallel with the critical path.

### MVP Checkpoint (Phase 0-2)

After completing Phase 2, the system delivers:

- ✅ Event capture across workspace signals
- ✅ Pattern detection from episodic memory
- ✅ Skill recommendations with confidence scoring
- ✅ skill-creator delegation for approved proposals

**Decision Point**: Validate MVP with real-world usage before proceeding to production features.

### Production Checkpoint (Phase 3-4)

After completing Phase 4, the system adds:

- ✅ Work item lifecycle integration
- ✅ PR feedback capture
- ✅ Efficiency-based prioritization
- ✅ ROI metrics for skill value

**Decision Point**: Evaluate efficiency improvements before investing in multi-provider support.

### Evolution Checkpoint (Phase 5)

After completing Phase 5, the system becomes:

- ✅ Self-improving through signal validation
- ✅ Learning-oriented with performance tracking
- ✅ Continuously refining pattern detection

**Decision Point**: Assess signal evolution effectiveness before expanding scope.

## Configuration & Settings

Default configuration in `vscode-pax-feedback/package.json`:

```json
{
  "pax.feedback.enabled": true,
  "pax.feedback.provider": "auto",
  "pax.feedback.captureInterval": 5000,
  "pax.feedback.storagePath": ".vscode/pax-memory"
}
```

Override per-workspace in `.vscode/settings.json`.

## Testing Strategy

Each phase includes:

- **Unit tests**: Individual components (providers, storage, analyzers)
- **Integration tests**: End-to-end workflows (capture → analyze → recommend)
- **Manual validation**: Real-world usage with PAX development
- **Performance tests**: Memory overhead, disk I/O, latency

## Success Metrics

### MVP Success (Phase 0-2)

- Extension activates without errors
- Captures 10+ event types
- Detects 3+ pattern types
- Generates 1+ recommendation per day

### Production Success (Phase 3-4)

- Work item completion triggers recommendations
- PR feedback captured and analyzed
- Efficiency ROI calculated for all recommendations
- 80%+ of high-ROI recommendations accepted

### Evolution Success (Phase 5)

- Signal performance tracked for 30+ days
- 3+ signals promoted to "proven" status
- 1+ low-performing signal retired
- Precision improves by 15%+

### Multi-Assistant Success (Phase 6)

- Works with 3+ AI assistants
- Provider auto-detection 95%+ accurate
- Provider-specific optimizations validated

## Related Documentation

- [Continuous Feedback Loop Architecture](architecture/continuous-feedback-loop.md)
- [Capture Events Skill](../skills/tools/capture-events/SKILL.md)
- [Creating Skill Workflow](../skills/workflow/creating-skill/SKILL.md)
- [Work Management Integration](WORK_MANAGEMENT_INTEGRATION.md)

## Revision History

- **2026-02-26**: Initial implementation plan (17 work items, 8 phases)
