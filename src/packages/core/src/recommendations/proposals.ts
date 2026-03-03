import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  RecommendationResult,
  RecommendationType,
} from './types';
import { formatProposalReviewList } from './proposals-review';

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'implemented';

export interface ProposalReviewEvent {
  reviewer: string;
  reason: string;
  status: Extract<ProposalStatus, 'approved' | 'rejected'>;
  reviewedAt: string;
}

export interface ProposalRecord {
  id: string;
  status: ProposalStatus;
  recommendation: RecommendationResult;
  createdAt: string;
  updatedAt: string;
  reviewHistory: ProposalReviewEvent[];
  implementationRef?: string;
}

export interface SkillCreatorInvocation {
  executor: 'skill-creator';
  action: 'enhance' | 'create' | 'create_project' | 'update_aspect' | 'update_agents';
  targetSkillId?: string;
  payload: {
    useCase: string;
    patternId: string;
    recommendationType: RecommendationType;
    evidenceIds: string[];
  };
}

export interface ProposalReviewInput {
  reviewer: string;
  reason: string;
  status: Extract<ProposalStatus, 'approved' | 'rejected'>;
}

export interface ProposalStorage {
  readAll(): Promise<ProposalRecord[]>;
  writeAll(proposals: ProposalRecord[]): Promise<void>;
}

export interface ProposalAnalytics {
  total: number;
  statusCounts: Record<ProposalStatus, number>;
  byRecommendationType: Record<RecommendationType, {
    total: number;
    approved: number;
    rejected: number;
    approvalRate: number;
  }>;
}

export class FileProposalStorage implements ProposalStorage {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async readAll(): Promise<ProposalRecord[]> {
    try {
      const content = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(content) as ProposalRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }

      throw error;
    }
  }

  async writeAll(proposals: ProposalRecord[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(proposals, null, 2)}\n`, 'utf8');
  }
}

export class ProposalService {
  private readonly storage: ProposalStorage;
  private readonly now: () => Date;

  constructor(storage: ProposalStorage, now: () => Date = () => new Date()) {
    this.storage = storage;
    this.now = now;
  }

  async createProposal(recommendation: RecommendationResult): Promise<ProposalRecord> {
    const proposals = await this.storage.readAll();
    const timestamp = this.now().toISOString();

    const proposal: ProposalRecord = {
      id: this.generateProposalId(recommendation, proposals.length + 1),
      status: 'pending',
      recommendation,
      createdAt: timestamp,
      updatedAt: timestamp,
      reviewHistory: [],
    };

    proposals.push(proposal);
    await this.storage.writeAll(proposals);

    return proposal;
  }

  async listProposals(status?: ProposalStatus): Promise<ProposalRecord[]> {
    const proposals = await this.storage.readAll();

    if (!status) {
      return proposals;
    }

    return proposals.filter((proposal) => proposal.status === status);
  }

  async reviewProposal(id: string, input: ProposalReviewInput): Promise<ProposalRecord> {
    const proposals = await this.storage.readAll();
    const proposal = proposals.find((candidate) => candidate.id === id);

    if (!proposal) {
      throw new Error(`Proposal ${id} not found.`);
    }

    if (proposal.status === 'implemented') {
      throw new Error(`Proposal ${id} is already implemented and cannot be re-reviewed.`);
    }

    const reviewedAt = this.now().toISOString();
    proposal.status = input.status;
    proposal.updatedAt = reviewedAt;
    proposal.reviewHistory.push({
      reviewer: input.reviewer,
      reason: input.reason,
      status: input.status,
      reviewedAt,
    });

    await this.storage.writeAll(proposals);

    return proposal;
  }

  async buildSkillCreatorInvocation(id: string): Promise<SkillCreatorInvocation> {
    const proposals = await this.storage.readAll();
    const proposal = proposals.find((candidate) => candidate.id === id);

    if (!proposal) {
      throw new Error(`Proposal ${id} not found.`);
    }

    if (proposal.status !== 'approved') {
      throw new Error(
        `Proposal ${id} requires explicit approval before skill-creator delegation.`
      );
    }

    const recommendationType = proposal.recommendation.delegation.recommendationType;

    return {
      executor: 'skill-creator',
      action: mapRecommendationTypeToAction(recommendationType),
      targetSkillId: proposal.recommendation.delegation.targetSkillId,
      payload: {
        useCase: proposal.recommendation.delegation.payload.useCase,
        patternId: proposal.recommendation.delegation.payload.patternId,
        recommendationType,
        evidenceIds: proposal.recommendation.delegation.payload.evidenceIds,
      },
    };
  }

  async markImplemented(id: string, implementationRef: string): Promise<ProposalRecord> {
    const proposals = await this.storage.readAll();
    const proposal = proposals.find((candidate) => candidate.id === id);

    if (!proposal) {
      throw new Error(`Proposal ${id} not found.`);
    }

    if (proposal.status !== 'approved') {
      throw new Error(`Proposal ${id} must be approved before marking implemented.`);
    }

    proposal.status = 'implemented';
    proposal.updatedAt = this.now().toISOString();
    proposal.implementationRef = implementationRef;

    await this.storage.writeAll(proposals);

    return proposal;
  }

  async getAnalytics(): Promise<ProposalAnalytics> {
    const proposals = await this.storage.readAll();

    const statusCounts: Record<ProposalStatus, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      implemented: 0,
    };

    const byRecommendationType = new Map<RecommendationType, {
      total: number;
      approved: number;
      rejected: number;
    }>();

    for (const proposal of proposals) {
      statusCounts[proposal.status] += 1;

      const recommendationType = proposal.recommendation.delegation.recommendationType;
      const current = byRecommendationType.get(recommendationType) ?? {
        total: 0,
        approved: 0,
        rejected: 0,
      };

      current.total += 1;
      if (proposal.status === 'approved' || proposal.status === 'implemented') {
        current.approved += 1;
      }

      if (proposal.status === 'rejected') {
        current.rejected += 1;
      }

      byRecommendationType.set(recommendationType, current);
    }

    return {
      total: proposals.length,
      statusCounts,
      byRecommendationType: Object.fromEntries(
        [...byRecommendationType.entries()].map(([recommendationType, summary]) => [
          recommendationType,
          {
            ...summary,
            approvalRate:
              summary.total === 0 ? 0 : Number((summary.approved / summary.total).toFixed(4)),
          },
        ])
      ) as ProposalAnalytics['byRecommendationType'],
    };
  }

  async renderReviewInterface(): Promise<string> {
    const proposals = await this.storage.readAll();
    return formatProposalReviewList(proposals);
  }

  private generateProposalId(
    recommendation: RecommendationResult,
    sequence: number
  ): string {
    const compactPatternId = recommendation.evidence.patternId
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24);

    return `proposal-${compactPatternId}-${sequence.toString().padStart(3, '0')}`;
  }
}

function mapRecommendationTypeToAction(
  recommendationType: RecommendationType
): SkillCreatorInvocation['action'] {
  switch (recommendationType) {
    case 'enhance_existing':
      return 'enhance';
    case 'create_project_skill':
      return 'create_project';
    case 'update_aspect':
      return 'update_aspect';
    case 'update_agents':
      return 'update_agents';
    case 'create_pax_skill':
    default:
      return 'create';
  }
}
