import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryProvider } from './provider';
import { MemoryRecord } from './types';

export interface ProviderConformanceSuiteConfig {
  providerName: string;
  createProvider: () => MemoryProvider;
}

const BASE_TIMESTAMP = '2026-03-02T00:00:00.000Z';

function buildRecord(overrides: Partial<MemoryRecord>): MemoryRecord {
  return {
    id: 'record-default',
    kind: 'episode',
    tier: 'episodic',
    content: 'default content',
    metadata: {},
    createdAt: BASE_TIMESTAMP,
    updatedAt: BASE_TIMESTAMP,
    expiresAt: null,
    embedding: null,
    governance: {
      sourceBackend: 'conformance-suite',
      confidenceInputs: ['unit-test'],
      retentionTier: 'episodic',
      replayProvenance: 'conformance-suite',
    },
    ...overrides,
  };
}

export function runMemoryProviderConformanceSuite(
  config: ProviderConformanceSuiteConfig
): void {
  describe(`${config.providerName} memory provider conformance`, () => {
    let provider: MemoryProvider;

    beforeEach(async () => {
      provider = config.createProvider();
      await provider.initialize();
    });

    afterEach(async () => {
      await provider.close();
    });

    it('stores and retrieves records by id', async () => {
      const expected = buildRecord({
        id: 'episode-1',
        content: 'first episode',
      });

      await provider.upsert(expected);
      const actual = await provider.getById(expected.id);

      expect(actual).toEqual(expected);
    });

    it('lists records by kind in chronological order', async () => {
      const recordA = buildRecord({
        id: 'pattern-1',
        kind: 'pattern',
        tier: 'semantic',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      });
      const recordB = buildRecord({
        id: 'pattern-2',
        kind: 'pattern',
        tier: 'semantic',
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      });
      const recordC = buildRecord({
        id: 'episode-2',
        kind: 'episode',
        tier: 'episodic',
      });

      await provider.upsert(recordB);
      await provider.upsert(recordC);
      await provider.upsert(recordA);

      const patterns = await provider.listByKind('pattern');

      expect(patterns.map((record) => record.id)).toEqual(['pattern-1', 'pattern-2']);
    });

    it('returns top-k semantic results with threshold filtering', async () => {
      await provider.upsert(
        buildRecord({
          id: 'semantic-high',
          kind: 'signal',
          tier: 'semantic',
          embedding: [1, 0, 0],
        })
      );

      await provider.upsert(
        buildRecord({
          id: 'semantic-mid',
          kind: 'signal',
          tier: 'semantic',
          embedding: [0.8, 0.2, 0],
        })
      );

      await provider.upsert(
        buildRecord({
          id: 'semantic-low',
          kind: 'signal',
          tier: 'semantic',
          embedding: [0, 1, 0],
        })
      );

      const results = await provider.semanticSearch({
        embedding: [1, 0, 0],
        topK: 2,
        similarityThreshold: 0.7,
        kind: 'signal',
      });

      expect(results).toHaveLength(2);
      expect(results[0].record.id).toBe('semantic-high');
      expect(results[1].record.id).toBe('semantic-mid');
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    });

    it('removes records that expired before the reference time', async () => {
      await provider.upsert(
        buildRecord({
          id: 'expired-record',
          expiresAt: '2026-03-01T00:00:00.000Z',
        })
      );

      await provider.upsert(
        buildRecord({
          id: 'active-record',
          expiresAt: '2026-03-03T00:00:00.000Z',
        })
      );

      const removed = await provider.deleteExpired('2026-03-02T00:00:00.000Z');

      expect(removed).toBe(1);
      expect(await provider.getById('expired-record')).toBeUndefined();
      expect(await provider.getById('active-record')).toBeDefined();
    });
  });
}
