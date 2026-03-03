import { performance } from 'node:perf_hooks';
import { MemoryProvider } from './provider';
import { MemoryRecord, MemoryRecordKind, SemanticMatch } from './types';

export interface BenchmarkSummary {
  provider: string;
  inserted: number;
  updated: number;
  queryCount: number;
  ingestMs: number;
  ingestThroughputPerSecond: number;
  updateMs: number;
  updateThroughputPerSecond: number;
  queryP50Ms: number;
  queryP95Ms: number;
  recallAtK: number;
  rankingQualityMrr: number;
  storageFootprintBytes: number;
}

export interface BenchmarkQuery {
  embedding: number[];
  expectedRecordIds: string[];
  kind?: MemoryRecordKind;
}

export interface BenchmarkConfig {
  records: MemoryRecord[];
  queries: BenchmarkQuery[];
  topK: number;
  threshold: number;
}

export interface BenchmarkRunOptions {
  measureStorageFootprintBytes?: () => Promise<number>;
}

function percentile(values: number[], target: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((target / 100) * sorted.length) - 1)
  );

  return sorted[index];
}

function ratePerSecond(count: number, durationMs: number): number {
  if (durationMs <= 0) {
    return 0;
  }

  return (count / durationMs) * 1000;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((runningTotal, value) => runningTotal + value, 0);
  return total / values.length;
}

function calculateRecallAtK(matches: SemanticMatch[], expectedIds: string[]): number {
  if (expectedIds.length === 0) {
    return 0;
  }

  const found = expectedIds.filter((expectedId) =>
    matches.some((match) => match.record.id === expectedId)
  );

  return found.length / expectedIds.length;
}

function calculateMrr(matches: SemanticMatch[], expectedIds: string[]): number {
  if (expectedIds.length === 0) {
    return 0;
  }

  const rank = matches.findIndex((match) => expectedIds.includes(match.record.id));
  if (rank < 0) {
    return 0;
  }

  return 1 / (rank + 1);
}

export async function runProviderBenchmark(
  provider: MemoryProvider,
  config: BenchmarkConfig,
  options: BenchmarkRunOptions = {}
): Promise<BenchmarkSummary> {
  await provider.initialize();

  const ingestStart = performance.now();
  for (const record of config.records) {
    await provider.upsert(record);
  }
  const ingestMs = performance.now() - ingestStart;

  const updateStart = performance.now();
  for (const record of config.records) {
    await provider.upsert({
      ...record,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...record.metadata,
        benchmarkUpdate: true,
      },
    });
  }
  const updateMs = performance.now() - updateStart;

  const queryLatencies: number[] = [];
  const recallScores: number[] = [];
  const rankingScores: number[] = [];

  for (const query of config.queries) {
    const queryStart = performance.now();
    const matches = await provider.semanticSearch({
      embedding: query.embedding,
      topK: config.topK,
      similarityThreshold: config.threshold,
      kind: query.kind,
    });
    queryLatencies.push(performance.now() - queryStart);
    recallScores.push(calculateRecallAtK(matches, query.expectedRecordIds));
    rankingScores.push(calculateMrr(matches, query.expectedRecordIds));
  }

  const storageFootprintBytes = options.measureStorageFootprintBytes
    ? await options.measureStorageFootprintBytes()
    : 0;

  await provider.close();

  return {
    provider: provider.name,
    inserted: config.records.length,
    updated: config.records.length,
    queryCount: config.queries.length,
    ingestMs,
    ingestThroughputPerSecond: ratePerSecond(config.records.length, ingestMs),
    updateMs,
    updateThroughputPerSecond: ratePerSecond(config.records.length, updateMs),
    queryP50Ms: percentile(queryLatencies, 50),
    queryP95Ms: percentile(queryLatencies, 95),
    recallAtK: average(recallScores),
    rankingQualityMrr: average(rankingScores),
    storageFootprintBytes,
  };
}

export interface BenchmarkSelection {
  primaryProvider: string;
  fallbackProvider: string;
}

export function selectPrimaryProvider(
  summaries: [BenchmarkSummary, BenchmarkSummary]
): BenchmarkSelection {
  const weightedScore = (summary: BenchmarkSummary): number =>
    summary.recallAtK * 0.35 +
    summary.rankingQualityMrr * 0.2 +
    summary.ingestThroughputPerSecond * 0.15 +
    summary.updateThroughputPerSecond * 0.15 -
    summary.queryP95Ms * 0.1 -
    summary.storageFootprintBytes * 0.00001 * 0.05;

  const [left, right] = summaries;
  const leftScore = weightedScore(left);
  const rightScore = weightedScore(right);

  if (leftScore >= rightScore) {
    return {
      primaryProvider: left.provider,
      fallbackProvider: right.provider,
    };
  }

  return {
    primaryProvider: right.provider,
    fallbackProvider: left.provider,
  };
}
