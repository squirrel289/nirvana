# PAX Core Control Plane

`src/packages/core` is the Nirvana control-plane package for the Continuous Feedback Loop (CFL).

It does not own editor-specific capture code. It owns decision-making: turning normalized events into measurable recommendations with clear efficiency and efficacy evidence.

## Mission

The core package exists to enforce the CFL optimization mandate:

1. Identify high-leverage opportunities to improve end-to-end efficacy.
2. Optimize token usage, context usage, request count, and elapsed time.
3. Forecast ROI before rollout, then track realized ROI against baseline.
4. Track proposal acceptance and post-promotion usage frequency.
5. Preserve recommendation quality across all channel classes and model cohorts.

## Scope

In scope:

- Event normalization contracts for cross-channel comparability.
- Pattern detection and recommendation scoring.
- ROI baseline, forecast, and realized-measurement logic (7/30/90 day windows).
- Acceptance and usage tracking for promoted changes.
- Cross-channel and per-model validation gates before global promotion.
- Local-first execution with optional external AgeMem bridge interfaces.

Out of scope:

- IDE/editor capture plumbing (for example VS Code provider internals).
- UI/webview rendering.
- Direct skill authoring automation without explicit human approval.

## Control-Plane Flow

1. Ingest normalized events from capture adapters.
2. Segment by channel class, assistant provider, and model cohort.
3. Detect repeated or costly patterns.
4. Score recommendations for efficacy and efficiency.
5. Generate proposal artifacts with summary, detail, and evidence tiers.
6. Track promotion outcomes and feed signal performance back into ranking.

## Core Concepts

- `assistant_provider`: integration surface (`codex`, `copilot`, `cursor`, etc.).
- `model_provider`: model vendor (`openai`, `anthropic`, `google`, etc.).
- `model_family`: product line (`gpt-5`, `claude-sonnet`, etc.).
- `model_version`: pinned revision when available.
- `model_id`: runtime model identifier from provider APIs.
- `model_cohort`: derived analytics grouping used for optimization and KPI segmentation.

## Package Modules

- `events/`: canonical event schema and normalization helpers.
- `analysis/`: detectors, thresholds, and pattern classifiers.
- `recommendations/`: scoring, routing, confidence, proposal lifecycle management, memory similarity search, and proposal assembly.
- `metrics/`: token/context/request/time and quality KPI calculators.
- `roi/`: baseline capture, forecasting, realized ROI tracking.
- `governance/`: promotion gates, cross-model validation rules, audit trail.
- `ports/`: storage and AgeMem bridge interfaces.

## Inputs and Outputs

Inputs:

- Event streams from IDE, extension, CLI, inline-edit, and cloud-agent channels.
- Optional enrichment context from external AgeMem systems.

Outputs:

- Ranked recommendation proposals with evidence.
- KPI snapshots segmented by channel and model cohort.
- Forecast vs realized ROI reports.
- Signal-performance data used for promotion/retirement decisions.

## Milestone Alignment

- Phase 1-2: baseline capture, pattern detection, recommendation generation.
- Phase 3-4: workflow triggers, efficiency scoring, ROI governance.
- Phase 5: acceptance/usage signal evolution and detector recalibration.
- Phase 6+: broader provider coverage, CLI/cloud profiles, external AgeMem routing.

## Integration Points

- VS Code capture extension: `src/extensions/vscode`.
- Workflows and skills: `skills/workflow/*`, `skills/tools/*`.
- Plan of record: [`docs/how-to/continuous-feedback-loop-implementation-plan.md`](../../../docs/how-to/continuous-feedback-loop-implementation-plan.md).
- Architecture reference: [`docs/architecture/continuous-feedback-loop.md`](../../../docs/architecture/continuous-feedback-loop.md).

## Current Status

Phase 1 memory kernel and Phase 2 recommendation core scaffolding are now implemented in-repo:

- `memory/`: provider contracts, adapters, routing, replay, benchmark, and conformance tests.
- `recommendations/`: routing matrix, confidence scoring, interaction-mode handling, delegation-only recommendation output, and proposal lifecycle (`pending`/`approved`/`rejected`/`implemented`) with analytics.

The remaining roadmap items (workflow-trigger integration, ROI governance modules, and signal evolution loops) should continue to follow the phased implementation plan while preserving local-first defaults and human-controlled promotion.
