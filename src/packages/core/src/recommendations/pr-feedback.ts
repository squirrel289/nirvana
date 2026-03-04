import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { generateSkillRecommendation } from './engine';
import { ProposalRecord, ProposalService } from './proposals';
import { InteractionMode } from './types';

const execFileAsync = promisify(execFile);
const DEFAULT_PR_LIMIT = 20;
const HIGH_WEIGHT_SIGNAL = 1.5;

const CATEGORY_KEYWORDS = {
  style: ['style', 'const', 'format', 'lint', 'naming', 'readability'],
  logic: ['logic', 'bug', 'edge case', 'error handling', 'validation', 'race'],
  testing: ['test', 'tests', 'coverage', 'assert', 'regression', 'mock'],
  documentation: ['docs', 'documentation', 'comment', 'readme', 'changelog'],
} as const;

type GhPrSummary = {
  number: number;
  url: string;
};

type GhFeedbackAuthor = {
  login?: string;
};

type GhComment = {
  id?: string;
  body?: string;
  createdAt?: string;
  url?: string;
  author?: GhFeedbackAuthor | null;
};

type GhReview = {
  id?: string;
  body?: string;
  createdAt?: string;
  url?: string;
  state?: string;
  author?: GhFeedbackAuthor | null;
};

type GhPrFeedbackPayload = {
  number: number;
  url: string;
  comments?: GhComment[];
  reviews?: GhReview[];
};

export type PrFeedbackCategory =
  | 'style'
  | 'logic'
  | 'testing'
  | 'documentation'
  | 'other';

export type PrFeedbackKind = 'comment' | 'review' | 'suggestion';

export interface PrFeedbackEvent {
  id: string;
  prNumber: number;
  prUrl: string;
  feedbackUrl: string;
  author: string;
  body: string;
  createdAt: string;
  kind: PrFeedbackKind;
  category: PrFeedbackCategory;
}

export interface PrFeedbackPattern {
  id: string;
  category: PrFeedbackCategory;
  theme: string;
  occurrences: number;
  feedbackIds: string[];
  prNumbers: number[];
}

export interface PrFeedbackSignal {
  id: string;
  source: 'pr_feedback';
  category: PrFeedbackCategory;
  weight: number;
  occurrences: number;
  patternId: string;
  feedbackIds: string[];
}

export interface PrFeedbackTriggerConfig {
  minimumOccurrences: number;
  minimumConfidence: number;
  interactionMode: InteractionMode;
}

export interface FeedbackAcknowledgmentRecord {
  proposalId: string;
  patternId: string;
  baselineOccurrences: number;
  followupOccurrences: number | null;
  acknowledged: boolean | null;
  updatedAt: string;
}

export type GhRunner = (args: string[]) => Promise<string>;

async function defaultGhRunner(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('gh', args, {
    maxBuffer: 10 * 1024 * 1024,
  });

  return stdout;
}

function normalizeBody(body: string | undefined): string {
  return body?.trim() ?? '';
}

function classifyKind(body: string, fallback: PrFeedbackKind): PrFeedbackKind {
  if (body.toLowerCase().includes('suggestion')) {
    return 'suggestion';
  }

  return fallback;
}

function listKeywords(category: Exclude<PrFeedbackCategory, 'other'>): readonly string[] {
  return CATEGORY_KEYWORDS[category];
}

export function classifyFeedback(body: string): PrFeedbackCategory {
  const normalized = body.toLowerCase();

  for (const keyword of listKeywords('testing')) {
    if (normalized.includes(keyword)) {
      return 'testing';
    }
  }

  for (const keyword of listKeywords('logic')) {
    if (normalized.includes(keyword)) {
      return 'logic';
    }
  }

  for (const keyword of listKeywords('documentation')) {
    if (normalized.includes(keyword)) {
      return 'documentation';
    }
  }

  for (const keyword of listKeywords('style')) {
    if (normalized.includes(keyword)) {
      return 'style';
    }
  }

  return 'other';
}

function deriveTheme(body: string, category: PrFeedbackCategory): string {
  if (category === 'other') {
    return 'general';
  }

  const normalized = body.toLowerCase();
  const match = listKeywords(category).find((keyword) =>
    normalized.includes(keyword)
  );

  return match ? match.replace(/\s+/g, '-') : category;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value): value is string => typeof value === 'string');
}

export class GhCliPrFeedbackCollector {
  private readonly runGh: GhRunner;

  constructor(runGh: GhRunner = defaultGhRunner) {
    this.runGh = runGh;
  }

  async captureRecentFeedback(options?: {
    limit?: number;
    state?: 'open' | 'closed' | 'all';
  }): Promise<PrFeedbackEvent[]> {
    const limit = options?.limit ?? DEFAULT_PR_LIMIT;
    const state = options?.state ?? 'all';

    const pullRequests = await this.listPullRequests(limit, state);
    const feedbackByPr = await Promise.all(
      pullRequests.map((pullRequest) => this.captureFeedbackForPr(pullRequest))
    );

    return feedbackByPr.flat().sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt)
    );
  }

  private async listPullRequests(
    limit: number,
    state: 'open' | 'closed' | 'all'
  ): Promise<GhPrSummary[]> {
    const raw = await this.runGh([
      'pr',
      'list',
      '--state',
      state,
      '--limit',
      String(limit),
      '--json',
      'number,url',
    ]);

    const parsed = JSON.parse(raw) as GhPrSummary[];
    return Array.isArray(parsed)
      ? parsed.filter((pr) => typeof pr.number === 'number' && typeof pr.url === 'string')
      : [];
  }

  private async captureFeedbackForPr(
    pullRequest: GhPrSummary
  ): Promise<PrFeedbackEvent[]> {
    const raw = await this.runGh([
      'pr',
      'view',
      String(pullRequest.number),
      '--json',
      'number,url,comments,reviews',
    ]);

    const payload = JSON.parse(raw) as GhPrFeedbackPayload;
    const comments = Array.isArray(payload.comments) ? payload.comments : [];
    const reviews = Array.isArray(payload.reviews) ? payload.reviews : [];

    const commentEvents = comments
      .map((comment) => this.toEvent(payload, comment, 'comment'))
      .filter((candidate): candidate is PrFeedbackEvent => candidate !== null);

    const reviewEvents = reviews
      .map((review) => this.toEvent(payload, review, 'review'))
      .filter((candidate): candidate is PrFeedbackEvent => candidate !== null);

    return [...commentEvents, ...reviewEvents];
  }

  private toEvent(
    pullRequest: GhPrFeedbackPayload,
    feedback: GhComment | GhReview,
    fallbackKind: PrFeedbackKind
  ): PrFeedbackEvent | null {
    const body = normalizeBody(feedback.body);
    if (body.length === 0) {
      return null;
    }

    const feedbackUrl =
      feedback.url ??
      `${pullRequest.url}#${fallbackKind}-${feedback.id ?? body.slice(0, 24)}`;
    const category = classifyFeedback(body);
    const kind = classifyKind(body, fallbackKind);

    return {
      id: feedbackUrl,
      prNumber: pullRequest.number,
      prUrl: pullRequest.url,
      feedbackUrl,
      author: feedback.author?.login ?? 'unknown',
      body,
      createdAt: feedback.createdAt ?? new Date(0).toISOString(),
      kind,
      category,
    };
  }
}

export function detectRecurringFeedback(
  events: PrFeedbackEvent[],
  minimumOccurrences: number = 3
): PrFeedbackPattern[] {
  const grouped = new Map<string, PrFeedbackEvent[]>();

  for (const event of events) {
    const theme = deriveTheme(event.body, event.category);
    const key = `${event.category}:${theme}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(event);
    grouped.set(key, bucket);
  }

  const patterns: PrFeedbackPattern[] = [];

  for (const [key, bucket] of grouped.entries()) {
    const [category, theme] = key.split(':');
    const prNumbers = [...new Set(bucket.map((event) => event.prNumber))];
    if (bucket.length < minimumOccurrences || prNumbers.length < 2) {
      continue;
    }

    patterns.push({
      id: `pr-feedback-${slugify(`${category}-${theme}`)}`,
      category: category as PrFeedbackCategory,
      theme,
      occurrences: bucket.length,
      feedbackIds: ensureStringArray(bucket.map((event) => event.feedbackUrl)),
      prNumbers,
    });
  }

  return patterns.sort((left, right) => right.occurrences - left.occurrences);
}

export function createHighWeightSignals(
  patterns: PrFeedbackPattern[]
): PrFeedbackSignal[] {
  return patterns.map((pattern) => ({
    id: `signal-${pattern.id}`,
    source: 'pr_feedback',
    category: pattern.category,
    weight: HIGH_WEIGHT_SIGNAL,
    occurrences: pattern.occurrences,
    patternId: pattern.id,
    feedbackIds: pattern.feedbackIds,
  }));
}

export class PrFeedbackProposalTrigger {
  private readonly proposalService: ProposalService;
  private readonly config: PrFeedbackTriggerConfig;

  constructor(options: {
    proposalService: ProposalService;
    config?: Partial<PrFeedbackTriggerConfig>;
  }) {
    this.proposalService = options.proposalService;
    this.config = {
      minimumOccurrences: options.config?.minimumOccurrences ?? 3,
      minimumConfidence: options.config?.minimumConfidence ?? 0.35,
      interactionMode: options.config?.interactionMode ?? 'collaborative',
    };
  }

  async createProposalFromPattern(
    pattern: PrFeedbackPattern
  ): Promise<ProposalRecord | null> {
    if (pattern.occurrences < this.config.minimumOccurrences) {
      return null;
    }

    const recommendation = await generateSkillRecommendation({
      patternId: pattern.id,
      useCase: `Reduce recurring PR feedback for ${pattern.category} (${pattern.theme}) across reviewed pull requests.`,
      occurrences: pattern.occurrences,
      channels: ['github_pr'],
      modelCohorts: ['reviewer-human'],
      workspaceSpecific: true,
      interactionMode: this.config.interactionMode,
      evidenceIds: pattern.feedbackIds,
      estimatedTimeSavedMinutes: Math.max(15, pattern.occurrences * 5),
      telemetryEvidence: {
        qualityLiftPct: 0.12,
        requestDeltaPct: -0.08,
      },
    });

    if (recommendation.confidence.value < this.config.minimumConfidence) {
      return null;
    }

    return this.proposalService.createProposal(recommendation);
  }
}

export class FeedbackAcknowledgmentTracker {
  private readonly records = new Map<string, FeedbackAcknowledgmentRecord>();
  private readonly now: () => Date;

  constructor(now: () => Date = () => new Date()) {
    this.now = now;
  }

  recordBaseline(
    proposalId: string,
    patternId: string,
    baselineOccurrences: number
  ): FeedbackAcknowledgmentRecord {
    const record: FeedbackAcknowledgmentRecord = {
      proposalId,
      patternId,
      baselineOccurrences,
      followupOccurrences: null,
      acknowledged: null,
      updatedAt: this.now().toISOString(),
    };

    this.records.set(proposalId, record);
    return record;
  }

  recordFollowup(
    proposalId: string,
    followupOccurrences: number
  ): FeedbackAcknowledgmentRecord {
    const existing = this.records.get(proposalId);
    if (!existing) {
      throw new Error(`Unknown proposal baseline for ${proposalId}`);
    }

    const updated: FeedbackAcknowledgmentRecord = {
      ...existing,
      followupOccurrences,
      acknowledged: followupOccurrences < existing.baselineOccurrences,
      updatedAt: this.now().toISOString(),
    };

    this.records.set(proposalId, updated);
    return updated;
  }

  listRecords(): FeedbackAcknowledgmentRecord[] {
    return [...this.records.values()].sort((left, right) =>
      left.updatedAt.localeCompare(right.updatedAt)
    );
  }
}
