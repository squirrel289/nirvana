import { describe, expect, it } from 'vitest';
import {
  FileProposalStorage,
  ProposalRecord,
  ProposalService,
} from './proposals';
import {
  classifyFeedback,
  createHighWeightSignals,
  detectRecurringFeedback,
  FeedbackAcknowledgmentTracker,
  GhCliPrFeedbackCollector,
  GhRunner,
  PrFeedbackProposalTrigger,
} from './pr-feedback';

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

function buildGhRunner(): GhRunner {
  return async (args: string[]) => {
    const command = args.join(' ');

    if (command.includes('pr list')) {
      return JSON.stringify([
        {
          number: 11,
          url: 'https://github.com/acme/nirvana/pull/11',
        },
        {
          number: 12,
          url: 'https://github.com/acme/nirvana/pull/12',
        },
      ]);
    }

    if (command.includes('pr view 11')) {
      return JSON.stringify({
        number: 11,
        url: 'https://github.com/acme/nirvana/pull/11',
        comments: [
          {
            id: 'c11',
            body: 'Please add regression tests for this change.',
            author: { login: 'reviewer-a' },
            createdAt: '2026-03-04T12:00:00.000Z',
            url: 'https://github.com/acme/nirvana/pull/11#issuecomment-11',
          },
        ],
        reviews: [
          {
            id: 'r11',
            body: 'Use const instead of let for immutable values.',
            author: { login: 'reviewer-b' },
            createdAt: '2026-03-04T12:01:00.000Z',
            url: 'https://github.com/acme/nirvana/pull/11#pullrequestreview-11',
          },
        ],
      });
    }

    if (command.includes('pr view 12')) {
      return JSON.stringify({
        number: 12,
        url: 'https://github.com/acme/nirvana/pull/12',
        comments: [
          {
            id: 'c12',
            body: 'Add tests for the new edge case branch.',
            author: { login: 'reviewer-c' },
            createdAt: '2026-03-04T12:02:00.000Z',
            url: 'https://github.com/acme/nirvana/pull/12#issuecomment-12',
          },
          {
            id: 'c13',
            body: 'Suggestion: include docs for this endpoint.',
            author: { login: 'reviewer-d' },
            createdAt: '2026-03-04T12:03:00.000Z',
            url: 'https://github.com/acme/nirvana/pull/12#issuecomment-13',
          },
        ],
        reviews: [
          {
            id: 'r12',
            body: 'Please increase test coverage for this path.',
            author: { login: 'reviewer-e' },
            createdAt: '2026-03-04T12:04:00.000Z',
            url: 'https://github.com/acme/nirvana/pull/12#pullrequestreview-12',
          },
        ],
      });
    }

    throw new Error(`Unhandled gh command: ${command}`);
  };
}

describe('pr feedback integration', () => {
  it('captures PR comments/reviews and classifies feedback categories', async () => {
    const collector = new GhCliPrFeedbackCollector(buildGhRunner());
    const events = await collector.captureRecentFeedback({ limit: 5 });

    expect(events).toHaveLength(5);
    expect(events.map((event) => event.kind)).toContain('review');
    expect(events.map((event) => event.kind)).toContain('suggestion');
    expect(events.map((event) => event.category)).toContain('testing');
    expect(events.map((event) => event.category)).toContain('style');
    expect(events.map((event) => event.category)).toContain('documentation');
  });

  it('detects recurring feedback patterns across multiple PRs', async () => {
    const collector = new GhCliPrFeedbackCollector(buildGhRunner());
    const events = await collector.captureRecentFeedback({ limit: 5 });
    const patterns = detectRecurringFeedback(events);

    expect(patterns).toHaveLength(1);
    expect(patterns[0].category).toBe('testing');
    expect(patterns[0].occurrences).toBe(3);
    expect(patterns[0].prNumbers).toEqual([11, 12]);
  });

  it('creates high-weight signals from recurring feedback patterns', async () => {
    const collector = new GhCliPrFeedbackCollector(buildGhRunner());
    const events = await collector.captureRecentFeedback({ limit: 5 });
    const patterns = detectRecurringFeedback(events);
    const signals = createHighWeightSignals(patterns);

    expect(signals).toHaveLength(1);
    expect(signals[0].source).toBe('pr_feedback');
    expect(signals[0].weight).toBe(1.5);
    expect(signals[0].feedbackIds).toContain(
      'https://github.com/acme/nirvana/pull/11#issuecomment-11'
    );
  });

  it('maps recurring feedback patterns to proposals with PR links', async () => {
    const proposalService = new ProposalService(
      new InMemoryProposalStorage(),
      () => new Date('2026-03-04T12:10:00.000Z')
    );

    const trigger = new PrFeedbackProposalTrigger({
      proposalService,
      config: {
        minimumOccurrences: 2,
      },
    });

    const proposal = await trigger.createProposalFromPattern({
      id: 'pr-feedback-testing-tests',
      category: 'testing',
      theme: 'tests',
      occurrences: 3,
      prNumbers: [11, 12],
      feedbackIds: [
        'https://github.com/acme/nirvana/pull/11#issuecomment-11',
        'https://github.com/acme/nirvana/pull/12#issuecomment-12',
        'https://github.com/acme/nirvana/pull/12#issuecomment-13',
      ],
    });

    expect(proposal).not.toBeNull();
    expect(proposal?.recommendation.evidence.episodeIds).toContain(
      'https://github.com/acme/nirvana/pull/11#issuecomment-11'
    );
  });

  it('tracks feedback acknowledgment after proposal rollout', () => {
    const tracker = new FeedbackAcknowledgmentTracker(
      () => new Date('2026-03-04T13:00:00.000Z')
    );

    tracker.recordBaseline('proposal-001', 'pr-feedback-testing-tests', 6);
    const result = tracker.recordFollowup('proposal-001', 2);

    expect(result.acknowledged).toBe(true);
    expect(result.baselineOccurrences).toBe(6);
    expect(result.followupOccurrences).toBe(2);
  });

  it('classifies text into expected categories', () => {
    expect(classifyFeedback('Please add tests for this branch')).toBe('testing');
    expect(classifyFeedback('Could you document this endpoint in README?')).toBe(
      'documentation'
    );
    expect(classifyFeedback('Use const and clean up lint issues')).toBe('style');
    expect(classifyFeedback('Add stronger validation and error handling')).toBe(
      'logic'
    );
  });
});
