import { DatabaseSync } from 'node:sqlite';
import { MemoryProvider } from '../provider';
import {
  cosineSimilarity,
  MemoryRecord,
  MemoryRecordKind,
  SemanticMatch,
  SemanticQuery,
} from '../types';

interface SqliteMemoryProviderOptions {
  databasePath?: string;
}

interface MemoryRecordRow {
  id: string;
  kind: string;
  tier: string;
  content: string;
  metadata_json: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  embedding_json: string | null;
  governance_json: string;
}

export class SqliteMemoryProvider implements MemoryProvider {
  readonly name = 'sqlite-counterpart';

  readonly capabilities = {
    ttlSupport: true,
    vectorSearch: true,
    graphTraversal: false,
  };

  private readonly databasePath: string;
  private database: DatabaseSync | null = null;

  constructor(options: SqliteMemoryProviderOptions = {}) {
    this.databasePath = options.databasePath ?? ':memory:';
  }

  async initialize(): Promise<void> {
    this.database = new DatabaseSync(this.databasePath);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS memory_records (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        tier TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        expires_at TEXT,
        embedding_json TEXT,
        governance_json TEXT NOT NULL
      )
    `);
  }

  async upsert(record: MemoryRecord): Promise<void> {
    const database = this.ensureDatabase();

    database
      .prepare(
        `
      INSERT INTO memory_records (
        id,
        kind,
        tier,
        content,
        metadata_json,
        created_at,
        updated_at,
        expires_at,
        embedding_json,
        governance_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id)
      DO UPDATE SET
        kind = excluded.kind,
        tier = excluded.tier,
        content = excluded.content,
        metadata_json = excluded.metadata_json,
        updated_at = excluded.updated_at,
        expires_at = excluded.expires_at,
        embedding_json = excluded.embedding_json,
        governance_json = excluded.governance_json
    `
      )
      .run(
        record.id,
        record.kind,
        record.tier,
        record.content,
        JSON.stringify(record.metadata),
        record.createdAt,
        record.updatedAt,
        record.expiresAt,
        record.embedding ? JSON.stringify(record.embedding) : null,
        JSON.stringify(record.governance)
      );
  }

  async getById(id: string): Promise<MemoryRecord | undefined> {
    const database = this.ensureDatabase();
    const row = database
      .prepare('SELECT * FROM memory_records WHERE id = ?')
      .get(id) as MemoryRecordRow | undefined;

    if (!row) {
      return undefined;
    }

    return this.mapRowToRecord(row);
  }

  async listByKind(kind: MemoryRecordKind): Promise<MemoryRecord[]> {
    const database = this.ensureDatabase();
    const rows = database
      .prepare('SELECT * FROM memory_records WHERE kind = ? ORDER BY created_at ASC')
      .all(kind) as MemoryRecordRow[];

    return rows.map((row) => this.mapRowToRecord(row));
  }

  async semanticSearch(query: SemanticQuery): Promise<SemanticMatch[]> {
    const database = this.ensureDatabase();
    const rows = query.kind
      ? ((database
          .prepare(
            'SELECT * FROM memory_records WHERE kind = ? AND embedding_json IS NOT NULL'
          )
          .all(query.kind) as MemoryRecordRow[])
      )
      : ((database
          .prepare('SELECT * FROM memory_records WHERE embedding_json IS NOT NULL')
          .all() as MemoryRecordRow[])
      );

    return rows
      .map((row) => {
        const record = this.mapRowToRecord(row);
        const score = cosineSimilarity(record.embedding ?? [], query.embedding);
        return { record, score };
      })
      .filter((match) => match.score >= query.similarityThreshold)
      .sort((left, right) => right.score - left.score)
      .slice(0, query.topK);
  }

  async deleteExpired(referenceTime: string): Promise<number> {
    const database = this.ensureDatabase();

    const expiredRows = database
      .prepare(
        'SELECT COUNT(1) AS total FROM memory_records WHERE expires_at IS NOT NULL AND expires_at < ?'
      )
      .get(referenceTime) as { total: number };

    database
      .prepare(
        'DELETE FROM memory_records WHERE expires_at IS NOT NULL AND expires_at < ?'
      )
      .run(referenceTime);

    return expiredRows.total;
  }

  async compact(): Promise<void> {
    const database = this.ensureDatabase();
    database.exec('VACUUM');
  }

  async close(): Promise<void> {
    if (this.database) {
      this.database.close();
      this.database = null;
    }
  }

  private ensureDatabase(): DatabaseSync {
    if (!this.database) {
      throw new Error('SqliteMemoryProvider is not initialized');
    }

    return this.database;
  }

  private mapRowToRecord(row: MemoryRecordRow): MemoryRecord {
    return {
      id: row.id,
      kind: row.kind as MemoryRecordKind,
      tier: row.tier as MemoryRecord['tier'],
      content: row.content,
      metadata: JSON.parse(row.metadata_json) as MemoryRecord['metadata'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
      embedding: row.embedding_json
        ? (JSON.parse(row.embedding_json) as number[])
        : null,
      governance: JSON.parse(row.governance_json) as MemoryRecord['governance'],
    };
  }
}
