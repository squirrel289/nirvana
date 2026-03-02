export type MemoryTier = 'episodic' | 'semantic' | 'procedural';

export type MemoryRecordKind = 'episode' | 'pattern' | 'signal' | 'proposal';

export type MemoryMetadataValue = string | number | boolean | null;

export interface MemoryGovernanceMetadata {
  sourceBackend: string;
  confidenceInputs: string[];
  retentionTier: MemoryTier;
  replayProvenance: string;
}

export interface MemoryRecord {
  id: string;
  kind: MemoryRecordKind;
  tier: MemoryTier;
  content: string;
  metadata: Record<string, MemoryMetadataValue>;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  embedding: number[] | null;
  governance: MemoryGovernanceMetadata;
}

export interface SemanticQuery {
  embedding: number[];
  topK: number;
  similarityThreshold: number;
  kind?: MemoryRecordKind;
}

export interface SemanticMatch {
  record: MemoryRecord;
  score: number;
}

export interface PatternDetectionInput {
  records: MemoryRecord[];
  now: string;
}

export interface DetectedPattern {
  id: string;
  name: string;
  description: string;
  matchedRecordIds: string[];
  confidence: number;
}

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  if (left.length !== right.length) {
    return 0;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];

    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}
