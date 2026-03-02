import { performance } from 'node:perf_hooks';
import { MemoryProvider } from './provider';
import { MemoryRecord } from './types';

export interface BenchmarkSummary {
  provider: string;
  inserted: number;
  queryCount: number;
  ingestMs: number;
  queryP50Ms: number;
  queryP95Ms: number;
}

export interface BenchmarkConfig {
  records: MemoryRecord[];
  queryEmbeddings: number[][];
  topK: number;
  threshold: number;
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

export async function runProviderBenchmark(
  provider: MemoryProvider,
  config: BenchmarkConfig
): Promise<BenchmarkSummary> {
  await provider.initialize();

  const ingestStart = performance.now();
  for (const record of config.records) {
    await provider.upsert(record);
  }
  const ingestMs = performance.now() - ingestStart;

  const queryLatencies: number[] = [];

  for (const embedding of config.queryEmbeddings) {
    const queryStart = performance.now();
    await provider.semanticSearch({
      embedding,
      topK: config.topK,
      similarityThreshold: config.threshold,
    });
    queryLatencies.push(performance.now() - queryStart);
  }

  await provider.close();

  return {
    provider: provider.name,
    inserted: config.records.length,
    queryCount: config.queryEmbeddings.length,
    ingestMs,
    queryP50Ms: percentile(queryLatencies, 50),
    queryP95Ms: percentile(queryLatencies, 95),
  };
}
