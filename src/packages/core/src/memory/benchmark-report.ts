import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { LanceMemoryProvider } from './adapters/lance-memory-provider';
import { SqliteMemoryProvider } from './adapters/sqlite-memory-provider';
import {
  BenchmarkConfig,
  BenchmarkSelection,
  BenchmarkSummary,
  runProviderBenchmark,
  selectPrimaryProvider,
} from './benchmark';
import { MemoryRecord } from './types';

const BASE_TIME = '2026-03-02T00:00:00.000Z';

function createRecord(id: string, embedding: number[]): MemoryRecord {
  return {
    id,
    kind: 'signal',
    tier: 'semantic',
    content: `seed-${id}`,
    metadata: {
      signalCatalogId: id.startsWith('typing') ? 'typing-loop' : 'context-bloat',
    },
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
    expiresAt: null,
    embedding,
    governance: {
      sourceBackend: 'benchmark-seed',
      confidenceInputs: ['seeded'],
      retentionTier: 'semantic',
      replayProvenance: 'benchmark-seed',
    },
  };
}

function benchmarkConfig(): BenchmarkConfig {
  return {
    records: [
      createRecord('typing-1', [1, 0, 0]),
      createRecord('typing-2', [0.95, 0.05, 0]),
      createRecord('typing-3', [0.9, 0.1, 0]),
      createRecord('context-1', [0, 1, 0]),
      createRecord('context-2', [0.05, 0.95, 0]),
      createRecord('context-3', [0.1, 0.9, 0]),
    ],
    queries: [
      {
        embedding: [1, 0, 0],
        expectedRecordIds: ['typing-1', 'typing-2'],
        kind: 'signal',
      },
      {
        embedding: [0, 1, 0],
        expectedRecordIds: ['context-1', 'context-2'],
        kind: 'signal',
      },
    ],
    topK: 2,
    threshold: 0.6,
  };
}

export interface MemoryABBenchmarkReport {
  generatedAt: string;
  summaries: BenchmarkSummary[];
  selection: BenchmarkSelection;
}

export async function runMemoryABBenchmark(): Promise<MemoryABBenchmarkReport> {
  const sqlitePath = path.join(
    os.tmpdir(),
    `pax-memory-ab-${Date.now()}-${Math.random().toString(16).slice(2)}.db`
  );
  const lancePath = path.join(
    os.tmpdir(),
    `pax-memory-ab-${Date.now()}-${Math.random().toString(16).slice(2)}.json`
  );

  try {
    const sqliteSummary = await runProviderBenchmark(
      new SqliteMemoryProvider({ databasePath: sqlitePath }),
      benchmarkConfig(),
      {
        measureStorageFootprintBytes: async () => {
          const stat = await fs.stat(sqlitePath);
          return stat.size;
        },
      }
    );

    const lanceSummary = await runProviderBenchmark(
      new LanceMemoryProvider({ storagePath: lancePath }),
      benchmarkConfig(),
      {
        measureStorageFootprintBytes: async () => {
          const stat = await fs.stat(lancePath);
          return stat.size;
        },
      }
    );

    const selection = selectPrimaryProvider([sqliteSummary, lanceSummary]);

    return {
      generatedAt: new Date().toISOString(),
      summaries: [sqliteSummary, lanceSummary],
      selection,
    };
  } finally {
    await fs.rm(sqlitePath, { force: true });
    await fs.rm(lancePath, { force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMemoryABBenchmark()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
