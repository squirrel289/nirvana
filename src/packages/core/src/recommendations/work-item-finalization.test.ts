import { describe, expect, it } from 'vitest';
import { MemoryRecord } from '../memory/types';
import {
  FileProposalStorage,
  ProposalRecord,
  ProposalService,
} from './proposals';
import {
  WorkItemFinalizationTrigger,
  WorkItemCompletionEvent,
  isCompletionTransition,
} from './work-item-finalization';

class InMemoryProposalStorage extends FileProposalStorage {
  private records: ProposalRecord[] = [];

  constructor() {
    super('/tmp/unused-proposals.json');
  }

  override async readAll(): Promise<ProposalRecord[]> {
    return [...this.records];
  }

  override async writeAll(proposals: ProposalRecord[]): Promise<void> {
    this.records = [...proposals];
  }
}

function buildRecord(overrides: Partial<MemoryRecord> = {}): MemoryRecord {
  return {
    id: `record-${Math.random().toString(16).slice(2)}`,
    kind: 'episode',
    tier: 'episodic',
    content: 'work item activity wi-006',
    metadata: {
      channel: 'cli',
      modelCohort: 'gpt-5',
      workItemId: 'wi-006',
      path: '/repo/backlog/006_cfl_phase3_work_item_finalization_triggers.md',
    },
    createdAt: '2026-03-03T12:00:00.000Z',
    updatedAt: '2026-03-03T12:00:00.000Z',
    expiresAt: null,
    embedding: null,
    governance: {
      sourceBackend: 'sqlite-counterpart',
      confidenceInputs: ['seeded'],
      retentionTier: 'episodic',
      replayProvenance: 'seeded',
    },
    ...overrides,
  };
}

function buildCompletionEvent(
  overrides: Partial<WorkItemCompletionEvent> = {}
): WorkItemCompletionEvent {
  return {
    workItemId: 'wi-006',
    path: '/repo/backlog/006_cfl_phase3_work_item_finalization_triggers.md',
    fromStatus: 'in-progress',
    toStatus: 'closed',
    timestamp: '2026-03-03T12:00:30.000Z',
    channel: 'cli',
    modelCohorts: ['gpt-5'],
    interactionMode: 'collaborative',
    ...overrides,
  };
}

describe('work-item finalization trigger', () => {
  it('detects completion transitions correctly', () => {
    expect(isCompletionTransition('in-progress', 'closed')).toBe(true);
    expect(isCompletionTransition('closed', 'closed')).toBe(false);
    expect(isCompletionTransition('ready', 'in-progress')).toBe(false);
  });

  it('creates proposal when completion event has enough lookback evidence', async () => {
    const proposalService = new ProposalService(
      new InMemoryProposalStorage(),
      () => new Date('2026-03-03T12:01:00.000Z')
    );

    const trigger = new WorkItemFinalizationTrigger({
      memory: {
        async replay() {
          return [buildRecord(), buildRecord(), buildRecord()];
        },
      },
      proposalService,
      now: () => new Date('2026-03-03T12:01:00.000Z'),
    });

    const proposal = await trigger.handleCompletionEvent(buildCompletionEvent());

    expect(proposal).not.toBeNull();
    expect(proposal?.status).toBe('pending');
    expect(proposal?.recommendation.evidence.occurrences).toBe(3);
    expect(proposal?.recommendation.delegation.executor).toBe('skill-creator');
  });

  it('returns null when below auto-trigger threshold', async () => {
    const proposalService = new ProposalService(
      new InMemoryProposalStorage(),
      () => new Date('2026-03-03T12:01:00.000Z')
    );

    const trigger = new WorkItemFinalizationTrigger({
      memory: {
        async replay() {
          return [buildRecord()];
        },
      },
      proposalService,
      now: () => new Date('2026-03-03T12:01:00.000Z'),
      config: {
        minimumOccurrences: 3,
      },
    });

    const proposal = await trigger.handleCompletionEvent(buildCompletionEvent());
    expect(proposal).toBeNull();
  });

  it('allows disabling auto-trigger generation', async () => {
    const proposalService = new ProposalService(
      new InMemoryProposalStorage(),
      () => new Date('2026-03-03T12:01:00.000Z')
    );

    const trigger = new WorkItemFinalizationTrigger({
      memory: {
        async replay() {
          return [buildRecord(), buildRecord(), buildRecord()];
        },
      },
      proposalService,
      now: () => new Date('2026-03-03T12:01:00.000Z'),
      config: {
        enabled: false,
      },
    });

    const proposal = await trigger.handleCompletionEvent(buildCompletionEvent());
    expect(proposal).toBeNull();
  });

  it('filters out stale lookback records', async () => {
    const proposalService = new ProposalService(
      new InMemoryProposalStorage(),
      () => new Date('2026-03-03T12:01:00.000Z')
    );

    const trigger = new WorkItemFinalizationTrigger({
      memory: {
        async replay() {
          return [
            buildRecord({ createdAt: '2026-03-03T11:50:00.000Z' }),
            buildRecord({ createdAt: '2026-02-20T11:50:00.000Z' }),
            buildRecord({ createdAt: '2026-02-18T11:50:00.000Z' }),
          ];
        },
      },
      proposalService,
      now: () => new Date('2026-03-03T12:01:00.000Z'),
      config: {
        minimumOccurrences: 1,
        minimumConfidence: 0,
        lookbackDays: 7,
      },
    });

    const proposal = await trigger.handleCompletionEvent(buildCompletionEvent());
    expect(proposal).not.toBeNull();
    expect(proposal?.recommendation.evidence.occurrences).toBe(1);
  });

  it('renders proposal template with work item context', async () => {
    const proposalService = new ProposalService(
      new InMemoryProposalStorage(),
      () => new Date('2026-03-03T12:01:00.000Z')
    );

    const trigger = new WorkItemFinalizationTrigger({
      memory: {
        async replay() {
          return [buildRecord(), buildRecord(), buildRecord()];
        },
      },
      proposalService,
      now: () => new Date('2026-03-03T12:01:00.000Z'),
    });

    const event = buildCompletionEvent();
    const proposal = await trigger.handleCompletionEvent(event);

    expect(proposal).not.toBeNull();

    const template = trigger.renderProposalTemplate(event, proposal as ProposalRecord);
    expect(template).toContain('Work Item: wi-006');
    expect(template).toContain('Status Transition: in-progress -> closed');
    expect(template).toContain('Recommendation Type:');
  });

  it('creates proposals within one minute of completion events', async () => {
    const proposalService = new ProposalService(
      new InMemoryProposalStorage(),
      () => new Date('2026-03-03T12:01:00.000Z')
    );

    const trigger = new WorkItemFinalizationTrigger({
      memory: {
        async replay() {
          return [buildRecord(), buildRecord(), buildRecord()];
        },
      },
      proposalService,
      now: () => new Date('2026-03-03T12:01:00.000Z'),
    });

    const event = buildCompletionEvent({
      timestamp: '2026-03-03T12:00:30.000Z',
    });
    const proposal = await trigger.handleCompletionEvent(event);

    expect(proposal).not.toBeNull();
    const completionAt = new Date(event.timestamp).getTime();
    const createdAt = new Date((proposal as ProposalRecord).createdAt).getTime();
    expect(createdAt - completionAt).toBeLessThanOrEqual(60_000);
  });
});
