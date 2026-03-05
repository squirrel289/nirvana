import { describe, expect, it } from 'vitest';
import {
  buildProgressiveDisclosure,
  buildRecommendationEfficiencyEvidence,
  estimateSummaryTokenCount,
  LocalFirstMetricCollector,
  rankRecommendationsByRoi,
  RoiTracker,
} from './efficiency';
import { RecommendationResult } from './types';

describe('LocalFirstMetricCollector', () => {
  it('captures canonical metric records with derived efficiency fields', () => {
    const collector = new LocalFirstMetricCollector();

    const record = collector.record({
      channel: 'cli',
      modelCohort: 'gpt-5',
      tokenCount: 1200,
      contextTokens: 500,
      contextWindowTokens: 4000,
      requestCount: 4,
      elapsedTimeMs: 24000,
      qualityScore: 0.8,
      capturedAt: '2026-03-05T00:00:00.000Z',
    });

    expect(record.contextOverheadTokens).toBe(3500);
    expect(record.elapsedTimePerRequestMs).toBe(6000);
    expect(record.requestEfficiency).toBeGreaterThan(0);

    const summary = collector.summarize();
    expect(summary.totalRecords).toBe(1);
    expect(summary.averageTokenCount).toBe(1200);
  });
});

describe('RoiTracker', () => {
  it('computes forecast ROI using (time_saved * frequency) / creation_cost', () => {
    const tracker = new RoiTracker();
    const forecast = tracker.forecast({
      frequency: 8,
      timeSavedMinutes: 15,
      creationCostMinutes: 120,
    });

    expect(forecast.projectedMinutesSaved).toBe(120);
    expect(forecast.roi).toBe(1);
  });

  it('stores realized ROI samples for follow-up tracking', () => {
    const tracker = new RoiTracker();

    tracker.recordRealized({
      proposalId: 'proposal-1',
      baselineTimeMinutes: 30,
      currentTimeMinutes: 12,
      baselineRequests: 6,
      currentRequests: 3,
      baselineTokens: 3000,
      currentTokens: 1800,
      creationCostMinutes: 120,
      capturedAt: '2026-03-05T01:00:00.000Z',
    });

    const latest = tracker.latest('proposal-1');
    expect(latest?.proposalId).toBe('proposal-1');
    expect(latest?.timeSavedMinutes).toBe(18);
    expect(latest?.roi).toBeGreaterThan(0);
  });
});

describe('buildRecommendationEfficiencyEvidence', () => {
  it('produces forecast and canonical metrics for recommendation scoring', () => {
    const evidence = buildRecommendationEfficiencyEvidence(
      {
        patternId: 'pattern-11',
        useCase: 'Automate repeated PR feedback handling',
        occurrences: 6,
        channels: ['cli', 'ide'],
        modelCohorts: ['gpt-5', 'claude-sonnet'],
        workspaceSpecific: true,
        interactionMode: 'collaborative',
        telemetryEvidence: {
          tokenCount: 1600,
          contextTokens: 900,
          contextWindowTokens: 8192,
          requestCount: 5,
          elapsedTimeMs: 30000,
          qualityScore: 0.75,
        },
      },
      {
        now: () => new Date('2026-03-05T00:00:00.000Z'),
      }
    );

    expect(evidence.canonical.channel).toBe('cli');
    expect(evidence.canonical.modelCohort).toBe('gpt-5');
    expect(evidence.forecast.frequency).toBe(6);
    expect(evidence.forecast.roi).toBeGreaterThan(0);
    expect(evidence.realized.proposalId).toBe('untracked');
  });
});

describe('progressive disclosure + ROI ranking', () => {
  it('enforces summary token budget for progressive disclosure output', () => {
    const disclosure = buildProgressiveDisclosure({
      recommendationType: 'create_project_skill',
      confidence: 0.84,
      roiForecast: 1.4,
      highRoi: true,
      useCase:
        'Build a workflow helper that automates repeated feedback triage, status updates, and recurring checklist cleanup across review cycles.',
      channels: ['cli', 'ide', 'extension'],
      modelCohorts: ['gpt-5', 'claude-sonnet'],
      occurrences: 9,
      episodeIds: ['ep-1', 'ep-2', 'ep-3'],
      rationale: ['Detected repeated pattern', 'Forecast suggests strong payoff'],
      maxSummaryTokens: 25,
    });

    expect(estimateSummaryTokenCount(disclosure.summary)).toBeLessThanOrEqual(25);
    expect(disclosure.detail.length).toBeGreaterThan(0);
    expect(disclosure.evidence.length).toBeGreaterThan(0);
  });

  it('ranks recommendations by forecast ROI in descending order', () => {
    const baseRecommendation: RecommendationResult = {
      routing: {
        type: 'create_project_skill',
        reason: 'Pattern is workspace-specific',
      },
      confidence: {
        value: 0.8,
        breakdown: {
          patternStrength: 0.8,
          channelCoverage: 0.8,
          modelCoverage: 0.8,
          efficiencySignal: 0.8,
          overlapSignal: 0.6,
        },
      },
      summary: {
        recommendationType: 'create_project_skill',
        confidence: 0.8,
        roiForecast: 0.5,
        highRoi: false,
        useCase: 'Base',
        interactionMode: 'yolo',
        requiresUserInput: false,
      },
      detail: {
        rationale: [],
        proposedChanges: [],
        nextSteps: [],
        disclosure: {
          summary: 'base',
          detail: [],
          evidence: [],
        },
      },
      evidence: {
        patternId: 'pattern',
        occurrences: 3,
        channels: ['cli'],
        modelCohorts: ['gpt-5'],
        episodeIds: [],
        memoryMatches: [],
        skillMatches: [],
        telemetry: null,
        efficiency: {
          canonical: {
            channel: 'cli',
            modelCohort: 'gpt-5',
            tokenCount: 1000,
            contextTokens: 500,
            contextWindowTokens: 8000,
            requestCount: 4,
            elapsedTimeMs: 12000,
            qualityScore: 0.7,
            capturedAt: '2026-03-05T00:00:00.000Z',
            contextOverheadTokens: 7500,
            tokenEfficiency: 0.0007,
            requestEfficiency: 0.175,
            elapsedTimePerRequestMs: 3000,
          },
          forecast: {
            roi: 0.5,
            frequency: 3,
            projectedMinutesSaved: 30,
            timeSavedMinutes: 10,
            creationCostMinutes: 60,
          },
          realized: {
            proposalId: 'untracked',
            roi: 0,
            projectedMinutesSaved: 0,
            timeSavedMinutes: 0,
            requestSavings: 0,
            tokenSavings: 0,
            creationCostMinutes: 60,
            capturedAt: '2026-03-05T00:00:00.000Z',
          },
          highRoi: false,
        },
      },
      delegation: {
        executor: 'skill-creator',
        executionPolicy: 'delegation_only',
        recommendationType: 'create_project_skill',
        payload: {
          useCase: 'Base',
          patternId: 'pattern',
          evidenceIds: [],
        },
      },
    };

    const low = baseRecommendation;
    const high: RecommendationResult = {
      ...baseRecommendation,
      summary: {
        ...baseRecommendation.summary,
        useCase: 'High',
        roiForecast: 2.1,
        highRoi: true,
      },
      evidence: {
        ...baseRecommendation.evidence,
        efficiency: {
          ...baseRecommendation.evidence.efficiency,
          forecast: {
            ...baseRecommendation.evidence.efficiency.forecast,
            roi: 2.1,
          },
          highRoi: true,
        },
      },
    };

    const ranked = rankRecommendationsByRoi([low, high]);
    expect(ranked[0].summary.useCase).toBe('High');
    expect(ranked[1].summary.useCase).toBe('Base');
  });
});
