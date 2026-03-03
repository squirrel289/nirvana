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
  routingMode?: MemoryRoutingMode;
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

export interface ReplayOptions {
  kind?: MemoryRecordKind;
  tier?: MemoryTier;
  since?: string;
  until?: string;
  limit?: number;
}

export type MemoryRoutingMode = 'primary-first' | 'fallback-first';

const ALL_KINDS: MemoryRecordKind[] = ['episode', 'pattern', 'signal', 'proposal'];
const TEMPORAL_CLUSTER_WINDOW_MS = 15 * 60 * 1000;

export class MemoryKernel {
  private readonly primaryProvider: MemoryProvider;
  private readonly fallbackProvider?: MemoryProvider;
  private readonly now: () => Date;
  private routingMode: MemoryRoutingMode;

  constructor(options: MemoryKernelOptions) {
    this.primaryProvider = options.primaryProvider;
    this.fallbackProvider = options.fallbackProvider;
    this.now = options.now ?? (() => new Date());
    this.routingMode = options.routingMode ?? 'primary-first';
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

  setRoutingMode(mode: MemoryRoutingMode): void {
    this.routingMode = mode;
  }

  getRoutingMode(): MemoryRoutingMode {
    return this.routingMode;
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
    const providers = this.getReadProviders();

    for (const provider of providers) {
      const record = await provider.getById(id);
      if (record) {
        return record;
      }
    }

    return undefined;
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
    const providers = this.getReadProviders();
    for (const provider of providers) {
      const matches = await provider.semanticSearch(query);
      if (matches.length > 0) {
        return matches;
      }
    }

    return [];
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

  async compact(): Promise<void> {
    await this.primaryProvider.compact();

    if (this.fallbackProvider) {
      await this.fallbackProvider.compact();
    }
  }

  async replay(options: ReplayOptions = {}): Promise<MemoryRecord[]> {
    const kinds = options.kind ? [options.kind] : ALL_KINDS;
    const recordsById = new Map<string, MemoryRecord>();

    for (const kind of kinds) {
      const primaryRecords = await this.primaryProvider.listByKind(kind);
      for (const record of primaryRecords) {
        recordsById.set(record.id, record);
      }

      if (!this.fallbackProvider) {
        continue;
      }

      const fallbackRecords = await this.fallbackProvider.listByKind(kind);
      for (const record of fallbackRecords) {
        if (!recordsById.has(record.id)) {
          recordsById.set(record.id, record);
        }
      }
    }

    const filteredRecords = [...recordsById.values()].filter((record) => {
      if (options.tier && record.tier !== options.tier) {
        return false;
      }

      if (options.since && record.createdAt < options.since) {
        return false;
      }

      if (options.until && record.createdAt > options.until) {
        return false;
      }

      return true;
    });

    filteredRecords.sort((left, right) => left.createdAt.localeCompare(right.createdAt));

    if (!options.limit || options.limit <= 0) {
      return filteredRecords;
    }

    return filteredRecords.slice(0, options.limit);
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

    const temporalPatterns = this.detectTemporalClusters(input.records);
    const signalCatalogPatterns = this.detectSignalCatalogMatches(input.records);

    patterns.push(...temporalPatterns);
    patterns.push(...signalCatalogPatterns);

    return patterns;
  }

  private detectTemporalClusters(records: MemoryRecord[]): DetectedPattern[] {
    const sortedRecords = [...records].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt)
    );
    const patterns: DetectedPattern[] = [];

    for (let startIndex = 0; startIndex < sortedRecords.length; startIndex += 1) {
      const startRecord = sortedRecords[startIndex];
      const startTime = new Date(startRecord.createdAt).getTime();
      const clusteredIds: string[] = [startRecord.id];

      for (
        let candidateIndex = startIndex + 1;
        candidateIndex < sortedRecords.length;
        candidateIndex += 1
      ) {
        const candidate = sortedRecords[candidateIndex];
        const candidateTime = new Date(candidate.createdAt).getTime();

        if (candidateTime - startTime > TEMPORAL_CLUSTER_WINDOW_MS) {
          break;
        }

        clusteredIds.push(candidate.id);
      }

      if (clusteredIds.length >= 3) {
        patterns.push({
          id: `temporal-${startRecord.id}`,
          name: 'temporal-activity-cluster',
          description:
            'Detected a burst of memory events within the configured temporal clustering window.',
          matchedRecordIds: clusteredIds,
          confidence: Math.min(1, clusteredIds.length / 8),
        });
      }
    }

    return patterns;
  }

  private detectSignalCatalogMatches(records: MemoryRecord[]): DetectedPattern[] {
    const signalGroups = new Map<string, MemoryRecord[]>();

    for (const record of records) {
      if (record.kind !== 'signal') {
        continue;
      }

      const catalogId = record.metadata.signalCatalogId;
      if (typeof catalogId !== 'string' || catalogId.length === 0) {
        continue;
      }

      const existing = signalGroups.get(catalogId) ?? [];
      existing.push(record);
      signalGroups.set(catalogId, existing);
    }

    const patterns: DetectedPattern[] = [];
    for (const [catalogId, groupedSignals] of signalGroups.entries()) {
      if (groupedSignals.length < 2) {
        continue;
      }

      patterns.push({
        id: `signal-catalog-${catalogId}`,
        name: 'signal-catalog-match',
        description: `Detected repeated signals mapped to catalog entry '${catalogId}'.`,
        matchedRecordIds: groupedSignals.map((record) => record.id),
        confidence: Math.min(1, groupedSignals.length / 6),
      });
    }

    return patterns;
  }

  private getReadProviders(): MemoryProvider[] {
    if (!this.fallbackProvider) {
      return [this.primaryProvider];
    }

    if (this.routingMode === 'fallback-first') {
      return [this.fallbackProvider, this.primaryProvider];
    }

    return [this.primaryProvider, this.fallbackProvider];
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
