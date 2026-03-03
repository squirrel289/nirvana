import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryKernel } from './kernel';
import { SqliteMemoryProvider } from './adapters/sqlite-memory-provider';

describe('MemoryKernel', () => {
  let primaryProvider: SqliteMemoryProvider;
  let fallbackProvider: SqliteMemoryProvider;

  beforeEach(async () => {
    primaryProvider = new SqliteMemoryProvider({ databasePath: ':memory:' });
    fallbackProvider = new SqliteMemoryProvider({ databasePath: ':memory:' });
  });

  afterEach(async () => {
    await primaryProvider.close();
    await fallbackProvider.close();
  });

  it('applies retention TTL by tier during upsert', async () => {
    const now = new Date('2026-03-02T00:00:00.000Z');
    const kernel = new MemoryKernel({
      primaryProvider,
      now: () => now,
    });

    await kernel.initialize();

    const episodic = await kernel.upsert({
      id: 'episode-ttl',
      kind: 'episode',
      tier: 'episodic',
      content: 'episodic entry',
    });

    const semantic = await kernel.upsert({
      id: 'semantic-ttl',
      kind: 'signal',
      tier: 'semantic',
      content: 'semantic entry',
      embedding: [1, 0, 0],
    });

    const procedural = await kernel.upsert({
      id: 'procedural-ttl',
      kind: 'proposal',
      tier: 'procedural',
      content: 'procedural entry',
    });

    expect(episodic.expiresAt).toBe('2026-03-09T00:00:00.000Z');
    expect(semantic.expiresAt).toBe('2026-04-01T00:00:00.000Z');
    expect(procedural.expiresAt).toBeNull();
  });

  it('uses fallback provider for semantic search when primary has no matches', async () => {
    const kernel = new MemoryKernel({
      primaryProvider,
      fallbackProvider,
    });

    await kernel.initialize();

    await fallbackProvider.upsert({
      id: 'fallback-signal',
      kind: 'signal',
      tier: 'semantic',
      content: 'fallback entry',
      metadata: {},
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
      expiresAt: null,
      embedding: [1, 0, 0],
      governance: {
        sourceBackend: fallbackProvider.name,
        confidenceInputs: ['seeded'],
        retentionTier: 'semantic',
        replayProvenance: 'fallback-seed',
      },
    });

    const matches = await kernel.semanticSearch({
      embedding: [1, 0, 0],
      topK: 3,
      similarityThreshold: 0.7,
      kind: 'signal',
    });

    expect(matches).toHaveLength(1);
    expect(matches[0].record.id).toBe('fallback-signal');
  });

  it('supports runtime routing-mode switching between primary and fallback', async () => {
    const kernel = new MemoryKernel({
      primaryProvider,
      fallbackProvider,
      routingMode: 'primary-first',
    });
    await kernel.initialize();

    await primaryProvider.upsert({
      id: 'shared-id',
      kind: 'signal',
      tier: 'semantic',
      content: 'primary-value',
      metadata: {},
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
      expiresAt: null,
      embedding: [1, 0, 0],
      governance: {
        sourceBackend: primaryProvider.name,
        confidenceInputs: ['seeded'],
        retentionTier: 'semantic',
        replayProvenance: 'primary-seed',
      },
    });

    await fallbackProvider.upsert({
      id: 'shared-id',
      kind: 'signal',
      tier: 'semantic',
      content: 'fallback-value',
      metadata: {},
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
      expiresAt: null,
      embedding: [0.5, 0.5, 0],
      governance: {
        sourceBackend: fallbackProvider.name,
        confidenceInputs: ['seeded'],
        retentionTier: 'semantic',
        replayProvenance: 'fallback-seed',
      },
    });

    expect(kernel.getRoutingMode()).toBe('primary-first');
    expect((await kernel.getById('shared-id'))?.content).toBe('primary-value');

    kernel.setRoutingMode('fallback-first');

    expect(kernel.getRoutingMode()).toBe('fallback-first');
    expect((await kernel.getById('shared-id'))?.content).toBe('fallback-value');
  });

  it('detects frequency-based patterns independent of backend source', () => {
    const kernel = new MemoryKernel({ primaryProvider });

    const patterns = kernel.detectPatterns({
      now: '2026-03-02T00:00:00.000Z',
      records: [
        {
          id: 'sig-1',
          kind: 'signal',
          tier: 'semantic',
          content: 'first',
          metadata: {},
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
          expiresAt: null,
          embedding: [1, 0, 0],
          governance: {
            sourceBackend: 'sqlite-counterpart',
            confidenceInputs: ['source-1'],
            retentionTier: 'semantic',
            replayProvenance: 'seed-1',
          },
        },
        {
          id: 'sig-2',
          kind: 'signal',
          tier: 'semantic',
          content: 'second',
          metadata: {},
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
          expiresAt: null,
          embedding: [0.8, 0.2, 0],
          governance: {
            sourceBackend: 'lance-counterpart',
            confidenceInputs: ['source-2'],
            retentionTier: 'semantic',
            replayProvenance: 'seed-2',
          },
        },
        {
          id: 'sig-3',
          kind: 'signal',
          tier: 'semantic',
          content: 'third',
          metadata: {},
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
          expiresAt: null,
          embedding: [0.7, 0.3, 0],
          governance: {
            sourceBackend: 'lance-counterpart',
            confidenceInputs: ['source-3'],
            retentionTier: 'semantic',
            replayProvenance: 'seed-3',
          },
        },
      ],
    });

    expect(patterns.some((pattern) => pattern.name === 'signal-frequency-cluster')).toBe(
      true
    );
    expect(patterns.some((pattern) => pattern.name === 'temporal-activity-cluster')).toBe(
      true
    );
    expect(patterns.some((pattern) => pattern.name === 'signal-catalog-match')).toBe(
      false
    );
  });

  it('detects signal catalog matching patterns when catalog ids repeat', () => {
    const kernel = new MemoryKernel({ primaryProvider });

    const patterns = kernel.detectPatterns({
      now: '2026-03-02T00:00:00.000Z',
      records: [
        {
          id: 'catalog-1',
          kind: 'signal',
          tier: 'semantic',
          content: 'alpha-1',
          metadata: {
            signalCatalogId: 'typing-loop',
          },
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
          expiresAt: null,
          embedding: [1, 0, 0],
          governance: {
            sourceBackend: 'sqlite-counterpart',
            confidenceInputs: ['seeded'],
            retentionTier: 'semantic',
            replayProvenance: 'seeded',
          },
        },
        {
          id: 'catalog-2',
          kind: 'signal',
          tier: 'semantic',
          content: 'alpha-2',
          metadata: {
            signalCatalogId: 'typing-loop',
          },
          createdAt: '2026-03-02T00:01:00.000Z',
          updatedAt: '2026-03-02T00:01:00.000Z',
          expiresAt: null,
          embedding: [0.9, 0.1, 0],
          governance: {
            sourceBackend: 'lance-counterpart',
            confidenceInputs: ['seeded'],
            retentionTier: 'semantic',
            replayProvenance: 'seeded',
          },
        },
      ],
    });

    const catalogPattern = patterns.find(
      (pattern) => pattern.id === 'signal-catalog-typing-loop'
    );
    expect(catalogPattern).toBeDefined();
    expect(catalogPattern?.matchedRecordIds).toEqual(['catalog-1', 'catalog-2']);
  });

  it('replays memory records with filters and fallback inclusion', async () => {
    const now = new Date('2026-03-02T00:00:00.000Z');
    const kernel = new MemoryKernel({
      primaryProvider,
      fallbackProvider,
      now: () => now,
    });
    await kernel.initialize();

    await kernel.upsert({
      id: 'primary-episode',
      kind: 'episode',
      tier: 'episodic',
      content: 'primary',
    });

    await fallbackProvider.upsert({
      id: 'fallback-signal',
      kind: 'signal',
      tier: 'semantic',
      content: 'fallback',
      metadata: {},
      createdAt: '2026-03-02T00:01:00.000Z',
      updatedAt: '2026-03-02T00:01:00.000Z',
      expiresAt: null,
      embedding: [1, 0, 0],
      governance: {
        sourceBackend: fallbackProvider.name,
        confidenceInputs: ['seeded'],
        retentionTier: 'semantic',
        replayProvenance: 'fallback-seed',
      },
    });

    const replayed = await kernel.replay({
      since: '2026-03-02T00:00:00.000Z',
      until: '2026-03-02T00:10:00.000Z',
      limit: 10,
    });

    expect(replayed.map((record) => record.id)).toEqual([
      'primary-episode',
      'fallback-signal',
    ]);

    await kernel.compact();
  });
});
