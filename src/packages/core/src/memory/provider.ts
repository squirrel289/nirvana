import { MemoryRecord, MemoryRecordKind, SemanticMatch, SemanticQuery } from './types';

export interface MemoryProviderCapabilities {
  ttlSupport: boolean;
  vectorSearch: boolean;
  graphTraversal: boolean;
}

export interface MemoryProvider {
  readonly name: string;
  readonly capabilities: MemoryProviderCapabilities;

  initialize(): Promise<void>;
  upsert(record: MemoryRecord): Promise<void>;
  getById(id: string): Promise<MemoryRecord | undefined>;
  listByKind(kind: MemoryRecordKind): Promise<MemoryRecord[]>;
  semanticSearch(query: SemanticQuery): Promise<SemanticMatch[]>;
  deleteExpired(referenceTime: string): Promise<number>;
  compact(): Promise<void>;
  close(): Promise<void>;
}
