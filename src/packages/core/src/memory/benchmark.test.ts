import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SqliteMemoryProvider } from './adapters/sqlite-memory-provider';
import { LanceMemoryProvider } from './adapters/lance-memory-provider';
import {
  BenchmarkConfig,
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
    content: `signal-${id}`,
    metadata: {
      signalCatalogId: `catalog-${id.startsWith('a') ? 'a' : 'b'}`,
    },
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
    expiresAt: null,
    embedding,
    governance: {
      sourceBackend: 'benchmark-seed',
      confidenceInputs: ['benchmark'],
      retentionTier: 'semantic',
      replayProvenance: 'benchmark-seed',
    },
  };
}

function testConfig(): BenchmarkConfig {
  return {
    records: [
      createRecord('a-1', [1, 0, 0]),
      createRecord('a-2', [0.9, 0.1, 0]),
      createRecord('b-1', [0, 1, 0]),
      createRecord('b-2', [0, 0.9, 0.1]),
    ],
    queries: [
      {
        embedding: [1, 0, 0],
        expectedRecordIds: ['a-1', 'a-2'],
        kind: 'signal',
      },
      {
        embedding: [0, 1, 0],
        expectedRecordIds: ['b-1', 'b-2'],
        kind: 'signal',
      },
    ],
    topK: 2,
    threshold: 0.5,
  };
}

describe('memory benchmark harness', () => {
  it('collects A/B benchmark metrics and selects primary/fallback providers', async () => {
    const sqlitePath = path.join(
      os.tmpdir(),
      `pax-memory-bench-${Date.now()}-${Math.random().toString(16).slice(2)}.db`
    );
    const lancePath = path.join(
      os.tmpdir(),
      `pax-memory-bench-${Date.now()}-${Math.random().toString(16).slice(2)}.json`
    );

    try {
      const sqliteSummary = await runProviderBenchmark(
        new SqliteMemoryProvider({ databasePath: sqlitePath }),
        testConfig(),
        {
          measureStorageFootprintBytes: async () => {
            const stat = await fs.stat(sqlitePath);
            return stat.size;
          },
        }
      );

      const lanceSummary = await runProviderBenchmark(
        new LanceMemoryProvider({ storagePath: lancePath }),
        testConfig(),
        {
          measureStorageFootprintBytes: async () => {
            const stat = await fs.stat(lancePath);
            return stat.size;
          },
        }
      );

      expect(sqliteSummary.inserted).toBe(4);
      expect(sqliteSummary.updated).toBe(4);
      expect(sqliteSummary.queryCount).toBe(2);
      expect(sqliteSummary.recallAtK).toBeGreaterThan(0);
      expect(sqliteSummary.rankingQualityMrr).toBeGreaterThan(0);
      expect(sqliteSummary.storageFootprintBytes).toBeGreaterThan(0);

      expect(lanceSummary.inserted).toBe(4);
      expect(lanceSummary.updated).toBe(4);
      expect(lanceSummary.queryCount).toBe(2);
      expect(lanceSummary.recallAtK).toBeGreaterThan(0);
      expect(lanceSummary.rankingQualityMrr).toBeGreaterThan(0);
      expect(lanceSummary.storageFootprintBytes).toBeGreaterThan(0);

      const selection = selectPrimaryProvider([sqliteSummary, lanceSummary]);

      expect(selection.primaryProvider).not.toBe(selection.fallbackProvider);
      expect([sqliteSummary.provider, lanceSummary.provider]).toContain(
        selection.primaryProvider
      );
      expect([sqliteSummary.provider, lanceSummary.provider]).toContain(
        selection.fallbackProvider
      );
    } finally {
      await fs.rm(sqlitePath, { force: true });
      await fs.rm(lancePath, { force: true });
    }
  });
});
