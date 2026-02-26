---
id: nir-phase-1-prd
type: document
subtype: product-requirements-document
lifecycle: active
status: accepted
title: "Nirvana Phase 1: Constant Feedback Loop - Product Requirements"
date_created: 2025-02-26
authors:
  - PAX Team
version: 1.0
related_work_items:
  - wi-003-memory-layer
  - cfl-adr-001-memory-storage-backend
---

## Executive Summary

The Constant Feedback Loop (CFL) is a multi-channel event orchestration and ROI optimization engine for AI-assisted coding. It captures events from multiple input sources (VS Code, CLI, inline editors), measures efficiency metrics (token cost, acceptance rate, context window utilization), and provides intelligent suggestions while supporting optional integration with external AgeMem systems.

CFL is **not** a storage solution—it is a **feedback loop orchestrator** that abstracts storage backends, enabling both minimal installs (zero external dependencies) and enterprise deployments (with multi-domain knowledge graphs).

---

## Product Vision

### Problem Statement

Developers use multiple AI-assisted coding tools across different channels:

- **IDEs** (Cursor, VS Code, JetBrains, Windsurf, Claude Code, etc.)
- **VS Code extensions** (GitHub Copilot, Codex, Kilo, etc.)
- **CLI LLMs** (copilot CLI, claude CLI, etc.)
- **Inline editors** (vim, VS Code inline edits, etc.)
- **Cloud agents** (Copilot, Gemini Code Assist, OpenClaw, etc.)

Currently, there is **no unified mechanism** to:

1. Capture events across all channels with explicit and implicit feedback signals
2. Measure efficiency (token cost per suggestion, acceptance rate, context window utilization)
3. Learn which channels/sources/LLMs work best for different coding tasks
4. Derive reward signals from user feedback to guide optimization (RLHF/RLRF readiness)
5. Trace interaction lineage (session history, prompt iterations, self-refine passes) for root-cause analysis
6. Integrate with existing AgeMem systems (knowledge graphs, semantic DBs)
7. Continuously optimize suggestion quality and cost

### Solution Overview

CFL provides:

- **Multi-channel event ingestion** (normalized event schema across VS Code, CLI, inline, IDEs, cloud agents)
- **Explicit & implicit feedback capture** (ratings, acceptance/rejection, edit distance, dwell time, self-refine success)
- **Heuristic reward signal derivation** (Phase 1: no model training; Phase 2: RLHF/RLRF-ready export)
- **Session history & interaction tracing** (prompt lineage, iteration count, self-refine passes for analysis)
- **ROI/efficiency metrics** (token efficiency, acceptance rate, latency, context %, quality, feedback-derived signals)
- **Storage abstraction** (pluggable backends: SQLite minimal install + enterprise AgeMem bridges)
- **Vector DB hooks** (interface-only in Phase 1; semantic similarity search in Phase 2+)
- **AgeMem integration** (query external knowledge graphs/vector DBs for richer context)
- **Feedback-driven optimization** (measure effectiveness, adjust recommendation strategy, learn over time)

---

## Key Features

### 1. Multi-Channel Event Ingestion

CFL captures normalized events from heterogeneous sources:

```typescript
interface CflEvent {
  // Core event
  channel: "vscode" | "cli" | "inline-edit" | "ide" | "cloud-agent";
  source: string; // e.g., 'GitHub Copilot', 'Claude CLI v1.2', 'vim'
  eventType:
    | "suggestion_generated"
    | "suggestion_accepted"
    | "suggestion_ignored"
    | "suggestion_applied"
    | "suggestion_refined"; // self-refine pass
  timestamp: Date;

  // Session & trace metadata (for interaction lineage)
  session?: {
    sessionId: string;
    requestId: string;
    parentRequestId?: string; // links to prior suggestion in refinement loop
    iterationIndex: number; // 0 for initial, 1+ for refinements
    selfRefinePass: boolean;
  };

  // Context
  taskContext: {
    fileType: string; // 'typescript', 'python', etc.
    operation: string; // 'completion', 'refactoring', 'generation'
    lineNumber?: number;
    codeSnippet?: string; // preceding context
  };

  // Model metadata (for RLHF/RLRF analysis)
  modelContext?: {
    modelProvider: string; // 'GitHub Copilot', 'Claude', 'Codex', etc.
    modelName: string;
    temperature?: number;
    promptTokens: number;
    completionTokens: number;
    systemPromptHash?: string; // don't store raw prompts; hash for privacy
  };

  // Cost/efficiency metrics
  metrics: {
    tokensRequested: number;
    tokensUsed: number;
    contextWindowSize: number;
    contextWindowUsed: number; // tokens used / window size
    latency: number; // milliseconds
    qualityScore?: "high" | "medium" | "low"; // user assessment
  };

  // Explicit & implicit feedback signals
  feedback?: {
    // Explicit feedback
    userRating?: number; // 1-5 scale
    userComment?: string;
    // Implicit feedback
    userAccepted: boolean;
    userModified: boolean;
    editDistance?: number; // character-level distance from suggestion to final code
    timeToAcceptance?: number; // milliseconds from suggestion to acceptance
    dwellTime?: number; // milliseconds user spent viewing suggestion
    // Code quality impact (captured async)
    codeQualityImpact?: "improved" | "neutral" | "degraded";
    linterErrorsBefore?: number;
    linterErrorsAfter?: number;
  };

  // Derived reward signal (heuristic in Phase 1)
  rewardSignal?: number; // 0-1 scale; derived from feedback + implicit signals. No model training in Phase 1.

  // AgeMem correlation (if available)
  agememCorrelation?: {
    similarPatternId?: string;
    relatedDecisionId?: string;
    historicalROI?: number;
    embeddingHash?: string; // placeholder for Phase 2 vector DB integration
  };
}
```

**Channels supported in MVP:**

- ✅ **VS Code extension** (vscode-pax-feedback): Capture editor selections, completions, refactorings
- ✅ **CLI** (subprocess): Parse stdout/stderr from `copilot`, `claude`, etc. CLI tools
- ✅ **Inline edits** (vim, VS Code inline): Listen to edit events from supported editors

**Extensibility (Phase 2+):**

- IDE plugins (JetBrains, Neovim)
- Code review systems (GitHub, GitLab)
- Custom LLM providers (internal APIs, proxies)

---

### 2. ROI & Efficiency Metrics

CFL calculates continuous metrics to answer:

- Which channels/sources generate the best ROI?
- Which LLMs are most efficient (token cost vs. quality)?
- How are we using context windows (full utilization or waste)?
- What is the acceptance rate trend over time?

```typescript
interface CflMetrics {
  // Token efficiency (primary KPI)
  tokenCostPerSuggestion: number; // avg tokens used per event
  acceptanceRate: number; // % of suggestions accepted (0-100)
  appliedRate: number; // % of suggestions actually applied (0-100)
  tokenROI: number; // insights gained / tokens spent

  // Context efficiency
  contextWindowUtilization: number; // avg % of window used (0-100)
  wastedContextRate: number; // requests using <20% of window

  // Latency
  avgLatency: number; // milliseconds
  p95Latency: number; // 95th percentile
  p99Latency: number; // 99th percentile

  // Quality (if available)
  qualityScore: number; // high=3, medium=2, low=1 (avg)
  codeQualityImpact: "improved" | "neutral" | "degraded"; // trend

  // Feedback-derived metrics
  avgRewardSignal: number; // 0-1 scale; heuristic in Phase 1
  editDistanceReduction: number; // % reduction in edits needed (0-100)
  timeToAcceptanceP50: number; // milliseconds, 50th percentile
  timeToAcceptanceP95: number; // milliseconds, 95th percentile
  selfRefineSuccessRate?: number; // % of self-refine passes that improved suggestion
  explicitFeedbackRate: number; // % of events with explicit ratings/comments

  // Segmentation (to identify best performers)
  byChannel?: {
    [channel: string]: CflMetrics;
  };
  bySource?: {
    [source: string]: CflMetrics; // e.g., 'GitHub Copilot', 'Claude CLI'
  };
  byModelProvider?: {
    [provider: string]: CflMetrics; // e.g., 'GitHub Copilot', 'Claude', 'Codex'
  };
  byFileType?: {
    [fileType: string]: CflMetrics;
  };
  bySessionType?: {
    [type: string]: CflMetrics; // 'single-shot' vs 'self-refine'
  };
  byTimeWindow?: {
    [window: string]: CflMetrics; // hourly, daily, weekly
  };
}
```

**Calculation frequency:**

- Real-time: Update metrics as events arrive
- Aggregated: Hourly, daily, weekly summaries (configurable)

**Visualization (Phase 2):**

- Dashboard: ROI by channel, source, file type, time
- Trends: Acceptance rate over time, token efficiency improvement
- Recommendations: "Switch to Claude for Python tasks" (historical ROI)

---

### 3. Storage Abstraction & Pluggable Backends

CFL abstracts all storage operations behind a backend interface, supporting both minimal and enterprise installs:

```typescript
interface IStorageBackend {
  // Core event storage
  storeEvent(event: CflEvent): Promise<string>; // returns event ID
  storeEvents(events: CflEvent[]): Promise<string[]>;

  // Query
  queryByChannel(channel: string, limit?: number): Promise<CflEvent[]>;
  queryBySource(source: string, limit?: number): Promise<CflEvent[]>;
  queryByFileType(fileType: string, limit?: number): Promise<CflEvent[]>;
  queryBySession(sessionId: string): Promise<CflEvent[]>; // NEW: support interaction lineage

  // Session history (NEW: for interaction tracing)
  storeSession(session: {
    sessionId: string;
    channel: string;
    source: string;
    startTime: Date;
    endTime?: Date;
    eventIds: string[];
  }): Promise<void>;
  getSession(sessionId: string): Promise<any>;

  // Metrics aggregation
  calculateMetrics(filters?: {
    channel?: string;
    source?: string;
    fileType?: string;
    timeRange?: { startDate: Date; endDate: Date };
  }): Promise<CflMetrics>;

  // Top performers (for optimization)
  identifyTopPerformers(metric: keyof CflMetrics, top: number): Promise<
    Array<{
      channel?: string;
      source?: string;
      fileType?: string;
      modelProvider?: string;
      value: number;
      eventCount: number;
    }>
  >;

  // Archival
  archiveEventsOlderThan(days: number): Promise<number>; // returns count archived

  // Export (for AgeMem integration, vector DB seeding, RLHF/RLRF analysis in Phase 2)
  exportEvents(filters?: {
    channel?: string;
    source?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<CflEvent[]>; // NEW-COMMENT: enable data portability for Phase 2 RLHF/RLRF
}
```

**Minimal Install (Default):**

- **SqliteStorageBackend**: File-based, single process, zero external dependencies
  - Episodic tier: Raw events (7-day rolling window)
  - Semantic tier: Aggregated metrics by channel/source/fileType (30-day)
  - Procedural tier: Learned ROI thresholds + suggestion strategies (permanent, user-configured)

**Enterprise/Extensible Installs (Phase 2+):**

- **CouchdbStorageBackend**: Document DB, semi-structured data, multi-domain
- **PostgresStorageBackend**: Structured events + JSONB metadata, advanced queries
- **MongodbStorageBackend**: Document-native, full flexibility
- **RethinkdbStorageBackend**: Real-time event streams, built-in aggregations

---

### 4. AgeMem Bridge Integration

CFL can optionally integrate with external AgeMem systems (knowledge graphs, semantic DBs):

```typescript
interface IAgememBridge {
  // Availability check
  isAvailable(): Promise<boolean>;

  // Semantic query
  querySemanticContext(event: CflEvent, topK: number): Promise<AgememMatch[]>;

  // Enrichment
  enrichMetrics(
    metrics: CflMetrics,
    agememContext: AgememMatch[],
  ): Promise<EnrichedMetrics>;

  // Correlation
  correlateWithPriorEvents(currentEvent: CflEvent): Promise<CorrelationResult>;
}

interface AgememMatch {
  type: "pattern" | "decision" | "outcome" | "codeChange";
  id: string;
  similarity: number; // 0-1
  metadata: Record<string, unknown>;
  historicalROI?: number;
}

interface EnrichedMetrics extends CflMetrics {
  agememContext: {
    similarPatternCount: number;
    relatedDecisions: string[];
    historicalAcceptanceRate: number; // from AgeMem
    predictedOutcome: "high" | "medium" | "low";
  };
}
```

**Minimal Install (No AgeMem):**

- CFL works standalone with local SQLite
- AgeMem bridge is not called (disabled)
- Full functionality: events, metrics, feedback loop

**Optional External AgeMem:**

- If Neo4J/PostgreSQL/vector DB is available, CFL queries it for richer context
- Enriches metrics with historical patterns and prior decisions
- Improves suggestion quality by considering multi-domain context
- Falls back to local SQLite if bridge unavailable (graceful degradation)

**Examples:**

- Neo4J bridge: Query knowledge graph for semantic similarity, related code changes
- PostgreSQL bridge: Query structured event history, JSONB metadata
- Vector DB bridge (Phase 3): Pure embedding-based similarity search

---

### 5. Background Idle Scheduler

CFL runs background jobs while VS Code has no focus. It derives reward signals from feedback and session traces, and prepares data for optional AgeMem integration.

```typescript
interface IIdleScheduler {
  // Heuristic reward signal derivation (Phase 1)
  deriveRewardSignals(): Promise<number>; // processes pending events, returns count processed

  // Aggregation for optimization
  aggregateMetricsOnIdle(timeWindow?: "hourly" | "daily" | "weekly"): Promise<CflMetrics>;

  // Cleanup
  cleanupOldEventsOnIdle(retentionDays?: number): Promise<number>; // returns count deleted

  // Top performer identification
  identifyTopPerformersOnIdle(): Promise<TopPerformerReport>;

  // AgeMem/semantic enrichment (Phase 1: optional polling; Phase 2: continuous)
  correlateNewEventsWithAgememOnIdle?(agememBridge: IAgememBridge): Promise<number>; // returns count enriched

  // RLHF/RLRF readiness (Phase 2+: not implemented in Phase 1)
  // - Export events for external training pipelines
  // - Generate feedback summaries for model fine-tuning
  // These methods will be added in Phase 2 ADR
}
```

**Scheduling:**

- Triggered by VS Code extension idle detection (no user input for N seconds)
- Non-blocking: Runs in background worker thread
- Configurable timeout (default: 5 minutes idle)
- Graceful shutdown on extension deactivate

---

## Requirements by Tier

### Tier 1: Core Event Capture & Storage (MVP, Phase 1)

- **Requirement**: Ingest events from VS Code + CLI, store in local SQLite, compute basic metrics
- **Phase**: Phase 1
- **Feedback Integration**: Capture explicit ratings + implicit feedback (acceptance, edit distance, dwell time)
- **Reward Signals**: Derive heuristic signals from acceptance rate + quality feedback; no model training
- **Example**: User rates suggestion 4/5 → rewardSignal = 0.8 (heuristic)

### Tier 2: Session Tracing & Interaction Lineage (Phase 1+)

- **Requirement**: Track suggestion refinement loops, store session metadata, link requests for analysis
- **Phase**: Phase 1 (implementation) + Phase 1.5 (optimization)
- **Feedback Integration**: Capture self-refine passes, iteration counts, edit sequences
- **Reward Signals**: Analyze refinement trajectories; reward longer session success rates
- **Example**: User requests suggestion, refines 2x, then accepts → session reward = 0.9

### Tier 3: AgeMem Integration (Phase 1 Optional)

- **Requirement**: Query external knowledge graphs for richer context; integrate results into CflEvent correlation
- **Phase**: Phase 1 (if AgeMem available), Phase 1+ required for Phase 2
- **Feedback Integration**: Tag events with AgeMem pattern IDs; track pattern-level acceptance rates
- **Reward Signals**: Elevate signals for events enriched with AgeMem insights
- **Phase 2+**: RLHF/RLRF will use AgeMem patterns as training anchors

### Tier 4: Feedback-Driven Optimization Readiness (Phase 1)

- **Requirement**: Export events in RLHF/RLRF-compatible format; prepare reward labels for Phase 2 model training
- **Phase**: Phase 1 (export infrastructure only); Phase 2+ (actual model training)
- **Feedback Integration**: Normalize feedback signals, compute composite reward heuristics, document signal derivation
- **Reward Signals**: Implement heuristic reward function (acceptance rate + quality score + latency penalty)
- **Phase 2+**: RLHF/RLRF will override heuristic with learned reward model

### Tier 5: Vector DB & Semantic Similarity (Phase 2+)

- **Requirement**: Integrate vector DBs for semantic search (similarity matching, anomaly detection)
- **Phase**: Phase 2+ (interface placeholder in Phase 1, implementation deferred)
- **Feedback Integration**: Use vector similarity to cluster feedback by semantically similar suggestions
- **Reward Signals**: Propagate reward signals across similar events ("if this pattern succeeded here, boost it elsewhere")
- **Phase 2+**: RLHF/RLRF will use embeddings for curriculum learning

---

## Non-Functional Requirements

### Performance

| Requirement                  | Target | Rationale                             |
| ---------------------------- | ------ | ------------------------------------- |
| Event ingestion latency      | <5ms   | Background, non-blocking              |
| Metrics calculation (hourly) | <500ms | Background idle job                   |
| ROI query (7-day window)     | <1s    | User dashboard responsiveness         |
| AgeMem query (if available)  | <2s    | Enrichment is async                   |
| Storage overhead (per event) | <1KB   | Minimal install should be lightweight |

### Reliability

- **Durability**: No data loss on extension crash (WAL-protected for SQLite)
- **Recovery**: Automatic recovery from partial writes (transaction safety)
- **Graceful degradation**: If AgeMem unavailable, fall back to local metrics

### Scalability

- **Event throughput**: Handle 100k+ events (1 million for enterprise)
- **Time windows**: 7-day episodic, 30-day semantic, permanent procedural tiers
- **Backend portability**: Can migrate from SQLite → PostgreSQL → Neo4J without code changes

### Security & Privacy

- **Data at rest**: SQLite file encryption (optional, user-controlled)
- **Export compliance**: GDPR-compatible data export/deletion
- **AgeMem integration**: Authenticated connections (API keys, OAuth)

---

## Constraints & Assumptions

### Constraints

1. **Local-First Minimal Install**: No external services required
2. **Zero Runtime Dependencies**: SQLite backend has no npm/pip dependencies
3. **Same-Process Execution**: All code runs in VS Code extension process (TypeScript) or subprocess (Python for embeddings)
4. **Backward Compatibility**: Events must export cleanly to external systems (JSON/JSONL)

### Assumptions

1. **VS Code is primary IDE**: CLI and inline editors are secondary
2. **AgeMem is optional**: Users can run CFL standalone; external system improves but isn't required
3. **Events are immutable**: Once stored, events are not updated (only archived)
4. **Metrics are derived**: ROI metrics are calculated from raw events, never user-modified

---

## Success Metrics

### KPIs for CFL Phase 1 MVP

1. **Event Capture Completeness**: >95% of suggestions captured across all channels
2. **Metric Accuracy**: Calculated ROI matches manual verification (within 5%)
3. **Storage Efficiency**: SQLite file <10MB for 100k events
4. **Feedback Coverage**: >80% of events have explicit or implicit feedback signals
5. **Reward Signal Validity**: Heuristic reward signals correlate with subsequent acceptance rate (R² > 0.7)
6. **Session Tracing**: >90% of self-refine chains fully linked (parentRequestId present)
7. **Backup/Export**: Users can export metrics + events in <2 seconds
8. **AgeMem Readiness**: Schema cleanly maps to Neo4J/PostgreSQL/vector DBs without data loss

### User-Facing KPIs (Phase 2+)

1. **Token Efficiency Improvement**: 10% reduction in token cost per suggestion (YoY)
2. **Acceptance Rate Increase**: 5% higher acceptance rate due to feedback-driven channel selection
3. **User Adoption**: 80% of users enable CFL metrics after first week
4. **RLHF/RLRF Readiness**: >10k labeled events available for model training at Phase 2 kickoff

---

## Out of Scope (Phase 1)

1. **"Multi-domain feedback-driven optimization (Phase 2 RLHF/RLRF)"** — Data export, heuristic reward signals, and AgeMem pattern tracking are Phase 1 foundations. Actual RLHF/RLRF model training deferred to Phase 2.
2. **"Vector similarity search (Phase 2+)"** — IStorageBackend.exportEvents() enables Phase 2 vector DB seeding. Semantic search interface placeholder added for future implementation; code not written in Phase 1.
3. **"Model retraining on user feedback (Phase 2 RLHF/RLRF)"** — Phase 1 derives heuristic reward signals. Phase 2 will implement actual model weight updates using feedback as training signal.
4. **"Cross-agent knowledge sharing (Phase 2+)"** — Phase 1 supports AgeMem query/export. Cross-agent RLRF (mutual learning) deferred to Phase 2 once AgeMem parity achieved.
5. **"Distributed/multi-user deployments"** — Phase 1 targets single user, single extension instance.
6. **"Encrypted audit trails"** — Basic logging only; encryption deferred to Phase 2+.

---

## Open Questions for Stakeholders

1. **AgeMem prioritization**: Is multi-domain support (Phase 2) critical for early feedback, or should Phase 1 focus on single-domain (VS Code) optimization?
2. **Storage backend priority**: Should Phase 1b support CouchDB/PostgreSQL, or focus on Neo4J integration first?
3. **Metrics granularity**: Store per-event metrics or aggregate (hourly)?
4. **Privacy**: Should CFL capture actual code snippets in events, or just file type / operation type?

---

## Related Documents

- [CFL ADR 001: Memory Storage Backend Selection (v1)](../adr/cfl-adr-001-memory-storage-backend.md) — **Superseded by updated CDA (Phase 1b)**
- [WI-003: CFL Phase 1 Memory Layer](../../backlog/003_cfl_phase1_memory_layer.md)
- [PAX Product Vision](../VISION.md) — AgeMem integration context
- [Architecture: Multi-Channel Event Orchestration](../architecture/cfl-multi-channel-design.md) — (To be created)

---

## Approval

- **Product Owner**: PAX Team
- **Technical Lead**: Engineering
- **Date Approved**: 2025-02-26
- **Version**: 1.0 (Initial)
- **Next Review**: After CDA Phase 1b completion
