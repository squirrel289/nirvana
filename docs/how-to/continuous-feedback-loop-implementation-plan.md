---
"$schema": https://raw.githubusercontent.com/templjs/templ.js/main/schemas/frontmatter/by-type/document/current.json
title: Continuous Feedback Loop Implementation Plan
lifecycle: active
created: 2026-02-26
audience: PAX contributors
---

Phased implementation roadmap for the Nirvana Continuous Feedback Loop (CFL), organized by milestones from MVP baseline through advanced features.

## Overview

This plan decomposes the [Continuous Feedback Loop Architecture](../../nirvana/architecture/continuous-feedback-loop.md) into concrete, actionable work items organized by phased milestones. Nirvana is treated as the optimization control plane that identifies efficacy opportunities, enforces efficiency constraints (token/context/request/time), and governs ROI tracking across all supported channels.

**Total Estimated Effort**: 344+ hours across 17 work items

## Nirvana Optimization Mandate

Each phase must preserve these non-negotiable outcomes:

1. Identify high-leverage opportunities to improve end-to-end efficacy.
2. Optimize token usage, context usage, request count, and elapsed time.
3. Forecast ROI before rollout, then track realized ROI against baseline.
4. Track proposal acceptance frequency and post-promotion usage frequency.
5. Ensure recommendation quality across all input/output channel classes and model cohorts.

## Terminology (Industry-Aligned)

This plan uses the same terminology as the architecture document:

- `assistant_provider`: Integration surface/provider adapter (for example `codex`, `copilot`, `cursor`).
- `model_provider`: Model vendor/company (for example `openai`, `anthropic`, `google`).
- `model_family`: Model class/product line (for example `gpt-5`, `claude-sonnet`).
- `model_version`: Specific pinned release/revision when available.
- `model_id`: Runtime model identifier from provider APIs.
- `model_cohort`: Derived analytics group for optimization and KPI segmentation.

`model_cohort` is intentionally derived; it complements standard identifiers rather than replacing them.

## Milestone Progression

- **MVP** (Phase 0-2): 108 hours → Lightweight default + VS Code extension + Codex/Copilot Chat coverage
- **Short-term** (Phase 3-5): +84 hours = 192 hours → External AgeMem support + inline editor support + Nirvana dogfooding phase 1
- **Mid-term** (Phase 6): +72 hours = 264 hours → CLI/cloud enablement + seamless external AgeMem alternative
- **Long-term** (Phase 7): +80 hours = 344+ hours → Dynamic/extensible KPI framework + adjacent-market expansion options

## Channel Coverage Requirements

**Input channels (must be measurable and comparable):**

- CLI (Claude, Copilot, Codex, and similar)
- IDEs (JetBrains, VS Code, Cursor, Claude Code, and similar)
- Extensions (Kilo Code, GitHub Copilot, Codex, Roo, and similar)
- Inline editors (VS Code editor, Vim, Emacs, and similar)
- External assistants (OpenClaw, Gemini Code Assistant, Copilot code reviewer, and similar)

**Output channels (must remain portable):**

- Lightweight local-first execution (default)
- Existing external AgeMem services (local or remote)

**Model coverage policy (must be measurable and comparable):**

- Track `model_id` (or normalized cohort when exact IDs are unavailable) for assistant-originated events
- Maintain per-model baselines and forecast/realized ROI comparisons
- Require cross-model validation before promoting globally-scoped optimizations

Every optimization recommendation must include cross-channel impact evidence instead of single-assistant-provider evidence only.
Every optimization recommendation must also include per-model impact evidence for the model cohorts where it is expected to apply.

## Phase 0: Extension Scaffolding (32 hours)

**Goal**: Establish foundational VS Code extension infrastructure

**Work Items**:

- [[001_cfl_phase0_extension_scaffolding]] - Extension scaffolding and assistant-provider infrastructure (32h)

**Deliverables**:

- VS Code extension with universal provider
- Codex and Copilot Chat capture stubs in VS Code integration surface
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

- `capture-events` skill with assistant-provider adapters
- JSONL episodic storage with 7-day TTL
- Pattern detection from episode frequency analysis
- Semantic memory tier with 30-day TTL
- Baseline snapshot capture for token/context/request/time by channel
- Baseline snapshot capture for token/context/request/time by model cohort

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
- Efficacy-opportunity classification (quality lift, acceptance lift, defect reduction)
- Cross-channel recommendation scoring constraints (not single-assistant-provider only)
- Per-model recommendation scoring constraints (not single-model only)

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
- Inline editor event ingestion path (VS Code editor/Vim/Emacs style flows)
- Nirvana dogfooding phase 1 instrumentation hooks

**Dependencies**: Phase 2 complete

**Milestone**: CFL integrates with existing PAX workflows

---

## Phase 4: Efficiency Optimization (48 hours)

**Goal**: Add efficiency metrics, ROI forecasting, and portability outputs

**Work Items**:

- [[008_cfl_phase4_efficiency_metrics]] - Implement LLM call tracking and ROI calculation (28h)
- [[009_cfl_phase4_skill_harvesting]] - Add frequency-weighted skill recommendations (20h)

**Deliverables**:

- LLM call counters, execution time tracking, context overhead measurement
- ROI calculation: (time_saved × frequency) / creation_cost
- Forecast vs realized ROI tracking against baseline windows (7/30/90 days)
- Forecast vs realized ROI segmented by channel and model cohort
- Skill harvesting recommendations ranked by efficiency
- Progressive disclosure (summary/detail/evidence tiers)
- External AgeMem output bridge (local/remote) with local-first fallback

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
- Proposal acceptance frequency tracking by channel
- Post-promotion usage frequency tracking by channel
- Proposal acceptance frequency tracking by model cohort
- Post-promotion usage frequency tracking by model cohort
- Signal promotion from candidate → validated → proven
- Retirement criteria for low-performing signals
- Evolving signal catalog in `signals.json`
- Nirvana dogfooding phase 1 review loop and scoring recalibration

**Dependencies**: Phase 3-4 complete

**Milestone**: System learns which patterns are valuable

---

## Phase 6: Extended Provider Support (72 hours)

**Goal**: Full multi-assistant compatibility with CLI/cloud enablement

**Work Items**:

- [[012_cfl_phase6_copilot_provider]] - Implement GitHub Copilot provider (24h)
- [[013_cfl_phase6_codex_cursor_providers]] - Implement Codex and Cursor providers (48h)

**Deliverables**:

- Copilot extension integration
- Codex API adapter
- Cursor extension integration
- CLI adapters for Codex/Copilot/Claude-style workflows
- Cloud deployment profile for hosted analysis and optional remote storage
- Provider auto-detection logic
- Assistant-provider-specific optimization
- Model cohort tracking and per-model optimization profiles
- Seamless local-first ↔ external AgeMem routing without workflow disruption

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
- Adjustable/dynamic/extensible KPI framework (custom KPI registration + weighting)
- AgeMem-backed expansion hypotheses for adjacent product and market opportunities

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
- ✅ VS Code extension path with Codex/Copilot Chat coverage
- ✅ Pattern detection from episodic memory
- ✅ Skill recommendations with confidence scoring
- ✅ skill-creator delegation for approved proposals
- ✅ Baseline capture for token/context/request/time metrics
- ✅ Baseline capture segmented by channel and model cohort

**Decision Point**: Validate MVP with real-world usage before proceeding to production features.

### Production Checkpoint (Phase 3-4)

After completing Phase 4, the system adds:

- ✅ Work item lifecycle integration
- ✅ PR feedback capture
- ✅ Efficiency-based prioritization
- ✅ ROI metrics for skill value
- ✅ External AgeMem bridge (local/remote) with local-first fallback
- ✅ Inline editor channel support

**Decision Point**: Evaluate efficiency improvements before investing in broader assistant-provider support.

### Evolution Checkpoint (Phase 5)

After completing Phase 5, the system becomes:

- ✅ Self-improving through signal validation
- ✅ Learning-oriented with performance tracking
- ✅ Continuously refining pattern detection
- ✅ Dogfooding-informed scoring adjustments
- ✅ Acceptance and usage frequency integrated into ranking
- ✅ Per-model performance deltas integrated into ranking

**Decision Point**: Assess signal evolution effectiveness before expanding scope.

## KPI Baseline & ROI Governance

Nirvana requires every proposal to include:

1. **Baseline snapshot**: Pre-change values for token/context/request/time, split by channel class and model cohort.
2. **Forecast model**: Expected ROI and expected efficacy lift before promotion.
3. **Realized tracking**: 7/30/90-day measurements after promotion.
4. **Adoption evidence**: Proposal acceptance frequency and post-promotion usage frequency, segmented by channel and model.
5. **Quality evidence**: Downstream acceptance/rework/defect trends relative to baseline.

Core KPI set (MVP required, extensible long-term):

- token efficiency
- context utilization efficiency
- request efficiency
- elapsed-time efficiency
- proposal acceptance frequency
- promoted-change usage frequency
- per-model efficiency and quality deltas
- quality lift indicators (for example review acceptance improvement)

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

`pax.feedback.provider` configures assistant-provider adapter routing; model vendor is tracked separately as `model_provider`.

Override per-workspace in `.vscode/settings.json`.

## Testing Strategy

Each phase includes:

- **Unit tests**: Individual components (assistant providers, storage, analyzers)
- **Integration tests**: End-to-end workflows (capture → analyze → recommend)
- **Manual validation**: Real-world usage with PAX development
- **Performance tests**: Memory overhead, disk I/O, latency

## Success Metrics

### MVP Success (Phase 0-2)

- Extension activates without errors
- Captures 10+ event types
- Captures Codex/Copilot Chat interactions in VS Code path
- Detects 3+ pattern types
- Generates 1+ recommendation per day
- Baseline metrics recorded for token/context/request/time on 90%+ of sessions
- Baseline metrics include model_id/model cohort on 90%+ of captured assistant sessions

### Production Success (Phase 3-4)

- Work item completion triggers recommendations
- PR feedback captured and analyzed
- Efficiency ROI calculated for all recommendations
- ROI forecast generated before promotion for 95%+ of recommendations
- ROI forecast segmented by model cohort for 90%+ of model-targeted recommendations
- 80%+ of high-ROI recommendations accepted
- External AgeMem output bridge operational with local-first fallback

### Evolution Success (Phase 5)

- Signal performance tracked for 30+ days
- 3+ signals promoted to "proven" status
- 1+ low-performing signal retired
- Precision improves by 15%+
- Proposal acceptance frequency and usage frequency captured per channel
- Proposal acceptance frequency and usage frequency captured per model cohort
- Forecast vs realized ROI error converges within ±20%

### Multi-Assistant Success (Phase 6)

- Works with 3+ AI assistants
- Provider auto-detection 95%+ accurate
- Assistant-provider-specific optimizations validated
- Per-model optimization profiles validated for top model cohorts per provider
- CLI and cloud profiles validated in production-like environments
- Seamless switching between local-first and external AgeMem outputs

## Related Documentation

- [Continuous Feedback Loop Architecture](../../nirvana/architecture/continuous-feedback-loop.md)
- [Capture Events Skill](../skills/tools/capture-events/SKILL.md)
- [Creating Skill Workflow](../skills/workflow/creating-skill/SKILL.md)
- [Work Management Integration](WORK_MANAGEMENT_INTEGRATION.md)

## Revision History

- **2026-02-27**: Added explicit per-model optimization coverage (model-cohort baselines, scoring constraints, KPI segmentation, and success criteria)
- **2026-02-27**: Reframed around Nirvana control-plane role; added cross-channel portability, KPI baseline/forecast governance, and phased MVP/short/mid/long rollout alignment
- **2026-02-26**: Initial implementation plan (17 work items, 8 phases)
