import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { MemoryProvider } from '../provider';
import {
  cosineSimilarity,
  MemoryRecord,
  MemoryRecordKind,
  SemanticMatch,
  SemanticQuery,
} from '../types';

interface LanceMemoryProviderOptions {
  storagePath?: string;
}

/**
 * Local-first LanceDB counterpart for MVP contract testing.
 *
 * This adapter intentionally stays local and file-backed for WI-003.
 * External or managed LanceDB rollout depth is deferred to WI-027.
 */
export class LanceMemoryProvider implements MemoryProvider {
  readonly name = 'lance-counterpart';

  readonly capabilities = {
    ttlSupport: true,
    vectorSearch: true,
    graphTraversal: false,
  };

  private readonly storagePath: string;
  private readonly records = new Map<string, MemoryRecord>();

  constructor(options: LanceMemoryProviderOptions = {}) {
    this.storagePath = options.storagePath ?? path.join(process.cwd(), '.tmp-lance-memory.json');
  }

  async initialize(): Promise<void> {
    try {
      const raw = await fs.readFile(this.storagePath, 'utf-8');
      const parsed = JSON.parse(raw) as MemoryRecord[];
      this.records.clear();
      for (const record of parsed) {
        this.records.set(record.id, record);
      }
    } catch (error) {
      const typedError = error as NodeJS.ErrnoException;
      if (typedError.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async upsert(record: MemoryRecord): Promise<void> {
    this.records.set(record.id, record);
    await this.flush();
  }

  async getById(id: string): Promise<MemoryRecord | undefined> {
    return this.records.get(id);
  }

  async listByKind(kind: MemoryRecordKind): Promise<MemoryRecord[]> {
    return [...this.records.values()]
      .filter((record) => record.kind === kind)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async semanticSearch(query: SemanticQuery): Promise<SemanticMatch[]> {
    return [...this.records.values()]
      .filter((record) => (query.kind ? record.kind === query.kind : true))
      .filter((record) => Array.isArray(record.embedding))
      .map((record) => ({
        record,
        score: cosineSimilarity(record.embedding ?? [], query.embedding),
      }))
      .filter((match) => match.score >= query.similarityThreshold)
      .sort((left, right) => right.score - left.score)
      .slice(0, query.topK);
  }

  async deleteExpired(referenceTime: string): Promise<number> {
    let removed = 0;
    for (const [id, record] of this.records.entries()) {
      if (record.expiresAt && record.expiresAt < referenceTime) {
        this.records.delete(id);
        removed += 1;
      }
    }

    if (removed > 0) {
      await this.flush();
    }

    return removed;
  }

  async compact(): Promise<void> {
    await this.flush();
  }

  async close(): Promise<void> {
    await this.flush();
  }

  private async flush(): Promise<void> {
    const directory = path.dirname(this.storagePath);
    await fs.mkdir(directory, { recursive: true });
    const records = [...this.records.values()];
    await fs.writeFile(this.storagePath, JSON.stringify(records, null, 2), 'utf-8');
  }
}
