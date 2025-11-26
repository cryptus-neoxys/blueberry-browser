import { getDatabase, MyDatabase } from "../database";
import { MemoryDocType } from "../database/schema";
import { randomUUID } from "crypto";
import { EmbeddingService } from "./EmbeddingService";

export interface MemoryListOptions {
  limit?: number;
  offset?: number;
  type?: "chat" | "page";
  search?: string;
  startDate?: number;
  endDate?: number;
}

export interface MemoryListResult {
  entries: MemoryDocType[];
  total: number;
  hasMore: boolean;
}

export class MemoryService {
  private dbPromise: Promise<MyDatabase>;
  private embeddingService: EmbeddingService;
  private onNewEntryCallback?: () => void;

  constructor(onNewEntry?: () => void) {
    this.dbPromise = getDatabase();
    this.embeddingService = EmbeddingService.getInstance();
    this.onNewEntryCallback = onNewEntry;
  }

  async addEntry(
    content: string,
    type: "chat" | "page",
    metadata: Record<string, unknown> = {},
    embedding: number[] = [],
  ): Promise<MemoryDocType> {
    const db = await this.dbPromise;
    const id = randomUUID();
    const timestamp = Date.now();

    let finalEmbedding = embedding;

    if (!finalEmbedding.length) {
      try {
        finalEmbedding = await this.embeddingService.generateEmbedding(content);
      } catch (error) {
        console.error("Failed to generate embedding", error);
        finalEmbedding = [];
      }
    }

    const doc = await db.memories.insert({
      id,
      content,
      type,
      metadata,
      timestamp,
      embedding: finalEmbedding,
    });

    const allDocs = await db.memories.find().exec();
    const stats = {
      totalEntries: allDocs.length,
      typeBreakdown: {
        chat: allDocs.filter((d) => d.type === "chat").length,
        page: allDocs.filter((d) => d.type === "page").length,
      },
    };

    console.log({
      content: content.slice(0, 150) + (content.length > 150 ? "..." : ""),
      embeddingDimensions: finalEmbedding.length,
      embeddingSample: finalEmbedding.slice(0, 5),
      type,
      stats,
      timestamp: new Date(timestamp).toISOString(),
    });

    // Trigger pattern detection
    if (this.onNewEntryCallback) {
      this.onNewEntryCallback();
    }

    return doc.toJSON() as MemoryDocType;
  }

  async listEntries(
    options: MemoryListOptions = {},
  ): Promise<MemoryListResult> {
    const db = await this.dbPromise;
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;

    const selector: Record<string, unknown> = {};
    if (options.type) {
      selector.type = options.type;
    }

    if (options.startDate || options.endDate) {
      const timestampSelector: Record<string, number> = {};
      if (options.startDate) {
        timestampSelector.$gte = options.startDate;
      }
      if (options.endDate) {
        timestampSelector.$lte = options.endDate;
      }
      selector.timestamp = timestampSelector;
    }

    const query = db.memories.find({
      selector,
      sort: [{ timestamp: "desc" }],
    });

    const docs = await query.exec();

    const filterBySearch = (entry: MemoryDocType): boolean => {
      if (!options.search) {
        return true;
      }
      const needle = options.search.toLowerCase();
      const haystack = [
        entry.content,
        entry.metadata ? JSON.stringify(entry.metadata) : "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    };

    const filtered = docs
      .map((doc) => doc.toJSON() as MemoryDocType)
      .filter(filterBySearch);

    const entries = filtered.slice(offset, offset + limit);
    const total = filtered.length;

    return {
      entries,
      total,
      hasMore: offset + limit < total,
    };
  }

  async queryEntries(limit: number = 10): Promise<MemoryDocType[]> {
    const result = await this.listEntries({ limit });
    return result.entries;
  }

  async getAllEntries(): Promise<MemoryDocType[]> {
    const result = await this.listEntries({ limit: Number.MAX_SAFE_INTEGER });
    return result.entries;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  async searchSimilar(
    query: string,
    limit: number = 5,
  ): Promise<Array<MemoryDocType & { similarity: number }>> {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    const allEntries = await this.getAllEntries();

    const scoredEntries = allEntries
      .map((entry) => ({
        ...entry,
        similarity: this.cosineSimilarity(
          queryEmbedding,
          entry.embedding || [],
        ),
      }))
      .filter((entry) => entry.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return scoredEntries;
  }
}
