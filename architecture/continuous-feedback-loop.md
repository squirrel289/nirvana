---
"$schema": https://raw.githubusercontent.com/templjs/templ.js/main/schemas/frontmatter/by-type/document/current.json
title: Continuous Feedback Loop Architecture
lifecycle: draft
created: 2026-02-26
audience: PAX contributors, AI assistant platform integrators
---

## Overview

The Continuous Feedback Loop (CFL) is PAX's assistant-agnostic system for learning from development patterns, generating skill improvement recommendations, and evolving the skills library based on observed usage. Unlike reference implementations (e.g., `pax/evolution` which contains the auto-evolution reference), this is the **canonical PAX feedback system** designed to work across GitHub Copilot, Codex, Cursor, and other AI assistants.

## Design Philosophy

1. **Assistant-Agnostic**: Works with any AI assistant through provider adapters
2. **Local-Only**: All data stays in workspace, no network calls, git-ignored storage
3. **Human-Controlled**: Proposals require explicit approval before promotion
4. **PAX-Native**: Uses existing skills, aspects, and workflow patterns
5. **Continuous Background**: Non-blocking analysis during idle time
6. **Evolving Signals**: Pattern detection rules improve over time

## System Architecture

```asciiflow
┌─────────────────────────────────────────────────────────────────────┐
│                  CONTINUOUS FEEDBACK LOOP (PAX)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   CAPTURE    │───▶│    MEMORY    │───▶│   ANALYZE    │          │
│  │   (Events)   │    │  (Patterns)  │    │ (Proposals)  │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                    │                    │                 │
│         ▼                    ▼                    ▼                 │
│  Provider Adapters   .vscode/pax-memory/   creating-skill          │
│  - Copilot                 │                      │                 │
│  - Codex              episodes.jsonl        Recommends:            │
│  - Cursor             patterns.json         - Enhance existing     │
│  - Universal          signals.json          - Create PAX skill     │
│                                              - Create project skill │
│                                              - Update aspect        │
│                                              - Update AGENTS.md     │
│                       ┌──────────────┐                              │
│                       │   PROMOTION  │◀─────────────────────────────┤
│                       │   (Human)    │                              │
│                       └──────────────┘                              │
│                             │                                       │
│                             ▼                                       │
│                      skill-creator                                  │
│                      (Execution)                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Capture Layer

**Skill**: [[capture-events/SKILL]] (new tool skill)  
**Location**: `skills/tools/capture-events/`

**Responsibilities**:

- Abstract workspace signals into standardized events
- Provide provider registry for assistant-specific adapters
- Local-only, append-only event stream
- No blocking on main workflow

**Event Schema**:

```json
{
  "timestamp": "2026-02-26T14:32:00.000Z",
  "provider": "copilot|codex|cursor|universal",
  "event_type": "file_modified|terminal_command|diagnostic|skill_invoked|chat_context",
  "metadata": {
    "file_path": "optional",
    "command": "optional",
    "skill_name": "optional",
    "diff_hash": "optional",
    "execution_result": "optional"
  }
}
```

**Provider Adapters**:

- **Universal**: Workspace-only signals (file watchers, terminal output parser, diagnostics)
- **Copilot**: Extension integration for Copilot-specific context
- **Codex**: API-based event capture
- **Cursor**: Extension integration for Cursor-specific context

**Facade Pattern**: Similar to [[pull-request-tool/SKILL]] which delegates to backend implementations, `capture-events` delegates to provider-specific adapters.

### 2. Memory Layer

**Storage Location**: `.vscode/pax-memory/` (git-ignored, local workspace)

**File Structure**:

```bash tree
.vscode/pax-memory/
├── episodes.jsonl          # Raw events (append-only)
├── patterns.json           # Detected patterns
├── signals.json            # Evolving signal definitions
└── proposals/              # Pending recommendations
    ├── enhance-PR001.md
    ├── new-skill-PR002.md
    └── aspect-update-PR003.md
```

**Memory Lifecycle** (inspired by auto-evolution reference):

- **Episodic**: Raw events, 7-day TTL, JSONL append-only
- **Semantic**: Aggregated patterns, 30-day TTL, JSON structured
- **Procedural**: Validated proposals, permanent (until promoted or rejected)

**Pattern Detection**:

```json
{
  "pattern_id": "repeated-file-read-pattern-001",
  "type": "repeated_tool_invocation",
  "occurrences": 5,
  "first_seen": "2026-02-20T10:00:00.000Z",
  "last_seen": "2026-02-26T14:32:00.000Z",
  "signature": {
    "tool": "read_file",
    "file_pattern": "backlog/*.md",
    "frequency": "multiple_per_session"
  },
  "confidence": 0.85,
  "skill_affinity": ["update-work-item", "creating-skill"]
}
```

### 3. Analyze Layer

**Background Scheduler**:

- Runs during IDE idle time (no active edits for 5+ minutes)
- Non-blocking, low-priority background task
- Configurable cadence (default: every 30 minutes idle)

**Pattern Detection Algorithm**:

1. Group episodes by similarity (file patterns, command patterns, skill sequences)
2. Count occurrences within sliding window (default: 7 days)
3. If count ≥ threshold (default: 3) → generate pattern candidate
4. Classify pattern by skill affinity (which existing skills this relates to)
5. Generate proposal draft

**Signal Catalog** (`signals.json`):

Baseline seeded from auto-evolution reference heuristics, then evolves:

```json
{
  "version": "1.0.0",
  "signals": [
    {
      "id": "repeated-file-read",
      "name": "Repeated File Read Pattern",
      "threshold": 3,
      "window_days": 7,
      "detector": "count_tool_invocations",
      "parameters": {
        "tool_name": "read_file",
        "same_file_exact": false,
        "same_file_pattern": true
      },
      "recommendation_type": "skill_enhancement",
      "confidence_boost": 1.2
    },
    {
      "id": "error-retry-pattern",
      "name": "Error Followed by Retry",
      "threshold": 2,
      "window_days": 1,
      "detector": "sequence_match",
      "parameters": {
        "sequence": [
          "terminal_command",
          "diagnostic_error",
          "terminal_command"
        ],
        "same_command": true
      },
      "recommendation_type": "new_skill",
      "confidence_boost": 1.5
    }
  ]
}
```

### 4. Recommendation Layer

**Skill**: [[creating-skill/SKILL]] (new workflow skill)  
**Location**: `skills/workflow/creating-skill/`

**Responsibilities**:

- Accept specific use case or idea input
- Search memory for similar patterns
- Compare against existing skills using [[skill-reviewer/SKILL]] patterns
- Output actionable recommendations following hybrid routing rules
- **Delegate** actual skill creation to [[skill-creator]]

**Hybrid Routing Logic**:

| Scenario                                 | Action                          | Location                                               |
| ---------------------------------------- | ------------------------------- | ------------------------------------------------------ |
| Pattern enhances existing PAX skill      | Recommend: improve in-place     | `pax/skills/{category}/{skill}/`                       |
| Pattern is reusable cross-project        | Recommend: create new PAX skill | `pax/skills/{category}/new-skill/`                     |
| Pattern is project-specific              | Recommend: create in workspace  | `{workspace}/skills/` or `{workspace}/.agents/skills/` |
| Pattern is meta-skill (routing/decision) | Recommend: create aspect        | `pax/skills/aspects/{aspect}/`                         |
| Pattern affects agent routing            | Recommend: update AGENTS.md     | `{workspace}/AGENTS.md`                                |

**Recommendation Output Format**:

```markdown
## Skill Recommendation: [Pattern Name]

**Type**: enhance_existing | create_pax_skill | create_project_skill | create_aspect | update_agents

**Confidence**: 0.85 (based on 5 occurrences over 6 days)

**Use Case**: [Derived from pattern + memory analysis]

**Similar Patterns in Memory**:

- Pattern ID: repeated-file-read-pattern-001 (5 occurrences)
- Related skills: update-work-item, creating-skill

**Existing Skill Analysis**:

- Skill: update-work-item
- Coverage gap: Does not handle batch updates efficiently
- Recommendation: Enhance with batch mode

**Proposed Enhancement**:

- Add `--batch` flag to update-work-item
- Accept array of work item IDs
- Parallel execution using [[parallel-execution]]

**Next Steps**:

1. Review this recommendation
2. If approved, invoke: `@agent use skill-creator to enhance update-work-item with batch mode`

**Evidence**:

- Episode IDs: [ep-101, ep-103, ep-107, ep-112, ep-115]
- Files affected: backlog/\*.md (9+ files in sequence)
- Time pattern: Repeated within single sessions
```

### 5. Promotion Layer

**Human-in-the-Loop Requirement**:

- All proposals remain in `.vscode/pax-memory/proposals/` until reviewed
- User explicitly approves/rejects via chat or VS Code command
- Approved proposals invoke [[skill-creator]] with full context
- Rejected proposals archived with rationale

**Workflow Integration**:

- Proposals can trigger during PR review cycles (part of [[handle-pr-feedback]])
- Proposals can surface after work item completion (part of [[finalize-work-item]])
- Manual invocation: `@agent analyze patterns and generate recommendations`

## Integration with PAX Workflows

### Integration Point 1: Work Item Lifecycle

When [[finalize-work-item]] completes:

1. CFL analyzes episodes from that work item's timeframe
2. Generates proposals for patterns observed during implementation
3. Surfaces recommendations for next iteration

### Integration Point 2: PR Feedback Cycle

When [[handle-pr-feedback]] detects repeated comment types:

1. CFL captures comment patterns
2. Suggests skill enhancements to prevent similar feedback
3. Builds institutional knowledge into skills

### Integration Point 3: Skill Creation Decision

When developer has an idea for a new skill:

1. Invoke [[creating-skill]] with use case description
2. CFL searches memory for related patterns
3. Compares against existing skills
4. Recommends enhance/create/compose approach
5. If approved, delegates to [[skill-creator]]

## Interaction Modes

Uses [[interaction-modes]] aspect:

**YOLO Mode**:

- Auto-capture events continuously
- Auto-analyze on idle schedule
- Generate proposals silently
- Notify user of proposals via non-blocking UI

**Collaborative Mode**:

- Prompt before starting background analysis
- Show pattern detection in progress
- Ask user to confirm recommendation before generating proposal
- Interactive review of proposals

## Skill Harvesting & Efficiency Optimization

Beyond pattern frequency, the feedback loop can identify **costly or inefficient patterns** and recommend optimizations that reduce:

- **LLM interaction count**: Detect sequences of multiple agent calls that could be batched
- **Execution time**: Identify repetitive manual steps that consume development time
- **Context overhead**: Find patterns that consume disproportionate token/context budgets
- **Error rates**: Patterns followed by diagnostic errors → suggest error handling skills

**Efficiency Metrics in Pattern Detection**:

```json
{
  "pattern_id": "repeated-pr-comment-resolution-005",
  "type": "repeated_workflow",
  "occurrences": 8,
  "efficiency": {
    "avg_interactions_per_pattern": 5,
    "total_time_spent_minutes": 120,
    "avg_time_per_pattern_minutes": 15,
    "estimated_savings_if_automated": {
      "interactions_saved": 40,
      "time_saved_minutes": 90,
      "percentage_reduction": 0.75
    }
  },
  "recommendation_priority": "high",
  "recommendation_type": "create_skill",
  "rationale": "Repeated 8x with 15 min avg. Harvesting as automated skill would save ~90 minutes and 40 LLM interactions on next occurrence."
}
```

**Harvesting Strategy**:

1. **Execution Log Analysis**: Capture not just what was done, but duration, token usage, interaction count
2. **Efficiency Thresholds**: Flag patterns consuming >10 minutes, >3 LLM interactions, or >20% context budget
3. **Cost-Benefit Calculation**: Estimate savings if pattern becomes higher-order skill
4. **Priority Ranking**: Recommend skills by ROI (time saved × frequency) rather than occurrence count alone

This transforms the feedback loop from "what patterns repeat?" to "what patterns are worth automating?"

## Progressive Disclosure & Context Preservation

Captured events and recommendations use **progressive disclosure** to preserve context window:

**Event Capture Optimization**:

- **Episodic Storage**: Store minimal metadata for frequent events (file path hash, command signature)
- **On-Demand Details**: Full content available only when creating-skill needs detailed analysis
- **Aggregation**: Group similar events (10 read_file calls on same file pattern → 1 aggregated event)

**Recommendation Output Format**:

- **Summary Tier** (always included): Use case, recommendation type, confidence, key evidence
- **Detail Tier** (on-demand): Full memory search results, overlap analysis, alternative approaches
- **Evidence Tier** (reference only): Specific episode IDs, timestamps (loaded only if needed)

Example:

```markdown
## Recommendation (Summary)

**Type**: Enhance update-work-item  
**Confidence**: 0.85  
**Efficiency Gain**: 45 min/week, 30 LLM calls/week

[Details available on request]
[Evidence: 5 episodes over 6 days]
```

User can request `show details` or `show evidence` without loading full analysis upfront.

## Performance Evaluation & Iterative Improvement

Each promoted skill's **performance is tracked and fed back into signal definitions**:

**Post-Promotion Metrics**:

After a harvested skill is created and used:

1. Track actual efficiency gains (compare before/after metrics)
2. Measure adoption rate and error frequency
3. Evaluate whether confidence score was accurate
4. Update signal definitions based on validation results

**Feedback Loop Closing**:

```asciiflow
Pattern Detected → Skill Recommended → User Approves → skill-creator Implements
                                                              ↓
                                                       Skill in Use
                                                              ↓
                                                    Metrics Collected
                                                              ↓
       ┌─────────────────────────────────────────────────────┘
       │
       ▼
Success: Actual gains match prediction → boost signal confidence
Partial: Some gains but not all → adjust signal threshold
Failure: No gains or adoption issues → archive skill, refine pattern detector
       │
       └─────────────────────────────────────────────────────┐
                                                              ↓
                                    Signal Definitions Evolve (signals.json)
```

**Signal Evolution Example**:

```json
{
  "id": "repeated-file-read",
  "name": "Repeated File Read Pattern",
  "threshold": 3,
  "confidence_from_validation": {
    "historically_created_skills": 12,
    "successful_adoptions": 10,
    "accuracy_rate": 0.83,
    "avg_efficiency_gain": "22 minutes/week"
  },
  "signal_confidence": 0.85,
  "last_updated": "2026-02-25T10:00:00Z",
  "update_reason": "Validation shows 83% of recommendations successful; threshold unchanged"
}
```

This enables **continuous evolution of signal definitions** without human recalibration.

## Configuration

**Default Settings** (workspace `.vscode/settings.json`):

```json
{
  "pax.feedbackLoop.enabled": true,
  "pax.feedbackLoop.provider": "universal",
  "pax.feedbackLoop.episodeTtlDays": 7,
  "pax.feedbackLoop.patternTtlDays": 30,
  "pax.feedbackLoop.patternThreshold": 3,
  "pax.feedbackLoop.analysisIdleMinutes": 5,
  "pax.feedbackLoop.analysisCadenceMinutes": 30,
  "pax.feedbackLoop.interactionMode": "yolo",
  "pax.feedbackLoop.signalCatalogPath": ".vscode/pax-memory/signals.json"
}
```

## Reference vs. Canonical

**Reference Material** (inspiration only):

- `pax/evolution/` directory contains auto-evolution reference implementation
- Demonstrates Claude Code-specific hooks and shell-based architecture
- Provides baseline signal heuristics and memory tier concepts
- Includes concepts like skill harvesting and efficiency analysis (adapted here)

**PAX Canonical** (this document):

- Assistant-agnostic design using provider adapters
- Integration with PAX skills, aspects, and workflows
- Local-only storage in `.vscode/pax-memory/`
- **Human-controlled promotion via [[skill-creator]]** (critical distinction)
- Efficiency-driven skill harvesting with cost/benefit analysis
- Performance evaluation and signal evolution through validation feedback

**Design Philosophy Note**:

Unlike some autonomous skill evolution systems, PAX maintains **human-in-the-loop oversight for all skill promotion decisions**. While the feedback loop automatically:

- ✅ Captures events (non-blocking background process)
- ✅ Detects patterns and efficiency opportunities
- ✅ Calculates cost/benefit metrics
- ✅ Generates proposals with evidence

It explicitly does NOT:

- ❌ Autonomously create or modify skills
- ❌ Autonomously refine signal definitions
- ❌ Bypass user approval for promotion

This maintains **human agency and control** while enabling **rapid learning and optimization**. Users remain in the decision loop, ensuring skills align with team values, constraints, and domain expertise.

## Future Enhancements

1. **Automated Signal Evolution**: Implement post-promotion validation metrics → signal definition updates
2. **Cross-Workspace Learning**: Aggregate anonymized patterns across multiple workspaces (opt-in)
3. **Confidence Scoring Models**: Machine learning for pattern confidence scoring
4. **Dashboard UI**: Visual interface for reviewing proposals, efficiency metrics, signal evolution
5. **Multi-Agent Collaboration**: Support shared memory and skill recommendations across agents
6. **Advanced Cost Analysis**: Track token usage, LLM API costs, and optimization ROI over time
7. **Progressive Disclosure UI**: Context-aware recommendation summaries with on-demand detail expansion

## Related Documentation

- [[SKILL_COMPOSITION]] - How skills compose and delegate
- [[ASPECTS]] - Interaction modes and cross-cutting concerns
- [[WORK_MANAGEMENT_INTEGRATION]] - Workflow lifecycle integration
- [[skill-creator]] - Skill creation and modification process
- [[skill-reviewer]] - Skill evaluation rubric and patterns
- Reference: `pax/evolution/ARCHITECTURE.md` - Auto-evolution reference (non-canonical)
