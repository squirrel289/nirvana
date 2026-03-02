import { MemoryProvider } from './provider';
import {
  DetectedPattern,
  MemoryGovernanceMetadata,
  MemoryRecord,
  MemoryRecordKind,
  MemoryTier,
  PatternDetectionInput,
  SemanticMatch,
  SemanticQuery,
} from './types';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface MemoryKernelOptions {
  primaryProvider: MemoryProvider;
  fallbackProvider?: MemoryProvider;
  now?: () => Date;
}

export interface UpsertMemoryInput {
  id: string;
  kind: MemoryRecordKind;
  tier: MemoryTier;
  content: string;
  metadata?: Record<string, string | number | boolean | null>;
  embedding?: number[];
  governance?: Partial<MemoryGovernanceMetadata>;
}

export class MemoryKernel {
  private readonly primaryProvider: MemoryProvider;
  private readonly fallbackProvider?: MemoryProvider;
  private readonly now: () => Date;

  constructor(options: MemoryKernelOptions) {
    this.primaryProvider = options.primaryProvider;
    this.fallbackProvider = options.fallbackProvider;
    this.now = options.now ?? (() => new Date());
  }

  async initialize(): Promise<void> {
    await this.primaryProvider.initialize();

    if (this.fallbackProvider) {
      await this.fallbackProvider.initialize();
    }
  }

  async close(): Promise<void> {
    await this.primaryProvider.close();

    if (this.fallbackProvider) {
      await this.fallbackProvider.close();
    }
  }

  async upsert(input: UpsertMemoryInput): Promise<MemoryRecord> {
    const currentTime = this.now();
    const timestamp = currentTime.toISOString();

    const record: MemoryRecord = {
      id: input.id,
      kind: input.kind,
      tier: input.tier,
      content: input.content,
      metadata: input.metadata ?? {},
      createdAt: timestamp,
      updatedAt: timestamp,
      expiresAt: this.calculateExpiry(input.tier, currentTime),
      embedding: input.embedding ?? null,
      governance: {
        sourceBackend: input.governance?.sourceBackend ?? this.primaryProvider.name,
        confidenceInputs: input.governance?.confidenceInputs ?? [],
        retentionTier: input.governance?.retentionTier ?? input.tier,
        replayProvenance:
          input.governance?.replayProvenance ??
          `${this.primaryProvider.name}:${timestamp}`,
      },
    };

    await this.primaryProvider.upsert(record);
    return record;
  }

  async getById(id: string): Promise<MemoryRecord | undefined> {
    const primaryRecord = await this.primaryProvider.getById(id);
    if (primaryRecord) {
      return primaryRecord;
    }

    if (!this.fallbackProvider) {
      return undefined;
    }

    return this.fallbackProvider.getById(id);
  }

  async listByKind(kind: MemoryRecordKind): Promise<MemoryRecord[]> {
    const primaryRecords = await this.primaryProvider.listByKind(kind);

    if (!this.fallbackProvider) {
      return primaryRecords;
    }

    const fallbackRecords = await this.fallbackProvider.listByKind(kind);
    return [...primaryRecords, ...fallbackRecords];
  }

  async semanticSearch(query: SemanticQuery): Promise<SemanticMatch[]> {
    const primaryMatches = await this.primaryProvider.semanticSearch(query);

    if (primaryMatches.length > 0 || !this.fallbackProvider) {
      return primaryMatches;
    }

    return this.fallbackProvider.semanticSearch(query);
  }

  async cleanup(): Promise<{ primaryRemoved: number; fallbackRemoved: number }> {
    const referenceTime = this.now().toISOString();
    const primaryRemoved = await this.primaryProvider.deleteExpired(referenceTime);
    let fallbackRemoved = 0;

    if (this.fallbackProvider) {
      fallbackRemoved = await this.fallbackProvider.deleteExpired(referenceTime);
    }

    return { primaryRemoved, fallbackRemoved };
  }

  detectPatterns(input: PatternDetectionInput): DetectedPattern[] {
    const groupedByKind = new Map<MemoryRecordKind, MemoryRecord[]>();

    for (const record of input.records) {
      const existing = groupedByKind.get(record.kind) ?? [];
      existing.push(record);
      groupedByKind.set(record.kind, existing);
    }

    const patterns: DetectedPattern[] = [];

    for (const [kind, records] of groupedByKind.entries()) {
      if (records.length >= 3) {
        patterns.push({
          id: `freq-${kind}`,
          name: `${kind}-frequency-cluster`,
          description: `Detected repeated ${kind} activity in memory stream.`,
          matchedRecordIds: records.map((record) => record.id),
          confidence: Math.min(1, records.length / 10),
        });
      }
    }

    return patterns;
  }

  private calculateExpiry(tier: MemoryTier, now: Date): string | null {
    if (tier === 'episodic') {
      return new Date(now.getTime() + 7 * DAY_IN_MS).toISOString();
    }

    if (tier === 'semantic') {
      return new Date(now.getTime() + 30 * DAY_IN_MS).toISOString();
    }

    return null;
  }
}
