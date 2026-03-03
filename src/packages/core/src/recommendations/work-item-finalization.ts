import { MemoryRecord } from '../memory/types';
import { generateSkillRecommendation } from './engine';
import { ProposalRecord, ProposalService } from './proposals';
import { InteractionMode } from './types';

const DEFAULT_COMPLETION_STATUSES = new Set(['closed', 'completed', 'done']);

export interface WorkItemCompletionEvent {
  workItemId: string;
  path: string;
  fromStatus?: string;
  toStatus: string;
  timestamp: string;
  title?: string;
  channel?: string;
  modelCohorts?: string[];
  interactionMode?: InteractionMode;
}

export interface WorkItemTriggerConfig {
  enabled: boolean;
  lookbackDays: number;
  minimumOccurrences: number;
  minimumConfidence: number;
  maxReplayRecords: number;
  defaultInteractionMode: InteractionMode;
  completionStatuses: Set<string>;
}

export interface MemoryReplayPort {
  replay(options?: {
    since?: string;
    until?: string;
    limit?: number;
  }): Promise<MemoryRecord[]>;
}

export function isCompletionTransition(
  fromStatus: string | undefined,
  toStatus: string,
  completionStatuses: Set<string> = DEFAULT_COMPLETION_STATUSES
): boolean {
  const normalizedToStatus = toStatus.toLowerCase();
  if (!completionStatuses.has(normalizedToStatus)) {
    return false;
  }

  if (!fromStatus) {
    return true;
  }

  const normalizedFromStatus = fromStatus.toLowerCase();
  return !completionStatuses.has(normalizedFromStatus);
}

export class WorkItemFinalizationTrigger {
  private readonly memory: MemoryReplayPort;
  private readonly proposalService: ProposalService;
  private readonly now: () => Date;
  private readonly config: WorkItemTriggerConfig;

  constructor(options: {
    memory: MemoryReplayPort;
    proposalService: ProposalService;
    now?: () => Date;
    config?: Partial<Omit<WorkItemTriggerConfig, 'completionStatuses'>> & {
      completionStatuses?: string[];
    };
  }) {
    this.memory = options.memory;
    this.proposalService = options.proposalService;
    this.now = options.now ?? (() => new Date());

    const configuredCompletionStatuses =
      options.config?.completionStatuses?.map((status) => status.toLowerCase()) ??
      [...DEFAULT_COMPLETION_STATUSES];

    this.config = {
      enabled: options.config?.enabled ?? true,
      lookbackDays: options.config?.lookbackDays ?? 7,
      minimumOccurrences: options.config?.minimumOccurrences ?? 3,
      minimumConfidence: options.config?.minimumConfidence ?? 0.35,
      maxReplayRecords: options.config?.maxReplayRecords ?? 500,
      defaultInteractionMode: options.config?.defaultInteractionMode ?? 'collaborative',
      completionStatuses: new Set(configuredCompletionStatuses),
    };
  }

  getLookbackWindow(reference: Date = this.now()): { since: string; until: string } {
    const until = reference.toISOString();
    const sinceDate = new Date(reference);
    sinceDate.setUTCDate(sinceDate.getUTCDate() - this.config.lookbackDays);

    return {
      since: sinceDate.toISOString(),
      until,
    };
  }

  async handleCompletionEvent(
    event: WorkItemCompletionEvent
  ): Promise<ProposalRecord | null> {
    if (!this.config.enabled) {
      return null;
    }

    if (
      !isCompletionTransition(
        event.fromStatus,
        event.toStatus,
        this.config.completionStatuses
      )
    ) {
      return null;
    }

    const { since, until } = this.getLookbackWindow(this.now());
    const replayedRecords = await this.memory.replay({
      since,
      until,
      limit: this.config.maxReplayRecords,
    });

    const relevantRecords = this.filterRelevantRecords(replayedRecords, event, since, until);

    if (relevantRecords.length < this.config.minimumOccurrences) {
      return null;
    }

    const channels = this.collectChannels(relevantRecords, event);
    const modelCohorts = this.collectModelCohorts(relevantRecords, event);

    const recommendation = await generateSkillRecommendation({
      patternId: `work-item-finalization-${event.workItemId}`,
      useCase: `Generate skill recommendation from work item completion of ${event.workItemId}.`,
      occurrences: relevantRecords.length,
      channels,
      modelCohorts,
      workspaceSpecific: true,
      interactionMode: event.interactionMode ?? this.config.defaultInteractionMode,
      evidenceIds: relevantRecords.map((record) => record.id),
      estimatedTimeSavedMinutes: Math.max(10, relevantRecords.length * 4),
      telemetryEvidence: {
        elapsedTimeDeltaPct: -0.15,
        requestDeltaPct: -0.1,
      },
    });

    if (recommendation.confidence.value < this.config.minimumConfidence) {
      return null;
    }

    return this.proposalService.createProposal(recommendation);
  }

  renderProposalTemplate(
    event: WorkItemCompletionEvent,
    proposal: ProposalRecord
  ): string {
    return [
      `# Work Item Trigger Proposal: ${proposal.id}`,
      '',
      `- Work Item: ${event.workItemId}`,
      `- Path: ${event.path}`,
      `- Status Transition: ${event.fromStatus ?? 'unknown'} -> ${event.toStatus}`,
      `- Recommendation Type: ${proposal.recommendation.summary.recommendationType}`,
      `- Confidence: ${proposal.recommendation.summary.confidence.toFixed(2)}`,
      `- Created At: ${proposal.createdAt}`,
      '',
      '## Rationale',
      ...proposal.recommendation.detail.rationale.map((line) => `- ${line}`),
      '',
      '## Next Steps',
      ...proposal.recommendation.detail.nextSteps.map((line) => `- ${line}`),
    ].join('\n');
  }

  private filterRelevantRecords(
    records: MemoryRecord[],
    event: WorkItemCompletionEvent,
    since: string,
    until: string
  ): MemoryRecord[] {
    return records.filter((record) => {
      if (record.createdAt < since || record.createdAt > until) {
        return false;
      }

      const metadataWorkItemId = this.readStringMetadata(record, 'workItemId');
      if (metadataWorkItemId === event.workItemId) {
        return true;
      }

      const metadataPath = this.readStringMetadata(record, 'path');
      if (metadataPath && metadataPath.includes('/backlog/')) {
        return true;
      }

      return record.content.includes(event.workItemId);
    });
  }

  private collectChannels(
    records: MemoryRecord[],
    event: WorkItemCompletionEvent
  ): string[] {
    const channels = new Set<string>();

    for (const record of records) {
      const value = this.readStringMetadata(record, 'channel');
      if (value) {
        channels.add(value);
      }
    }

    if (event.channel) {
      channels.add(event.channel);
    }

    if (channels.size === 0) {
      channels.add('cli');
    }

    return [...channels];
  }

  private collectModelCohorts(
    records: MemoryRecord[],
    event: WorkItemCompletionEvent
  ): string[] {
    const cohorts = new Set<string>(event.modelCohorts ?? []);

    for (const record of records) {
      const value = this.readStringMetadata(record, 'modelCohort');
      if (value) {
        cohorts.add(value);
      }
    }

    if (cohorts.size === 0) {
      cohorts.add('unknown');
    }

    return [...cohorts];
  }

  private readStringMetadata(record: MemoryRecord, key: string): string | undefined {
    const value = record.metadata[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }
}
