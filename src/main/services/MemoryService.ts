import { getDatabase, MyDatabase } from "../database";
import { MemoryDocType } from "../database/schema";
import { randomUUID } from "crypto";
import { EmbeddingService } from "./EmbeddingService";

export class MemoryService {
  private dbPromise: Promise<MyDatabase>;
  private embeddingService: EmbeddingService;

  constructor() {
    this.dbPromise = getDatabase();
    this.embeddingService = EmbeddingService.getInstance();
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

    return doc.toJSON() as MemoryDocType;
  }

  async queryEntries(limit: number = 10): Promise<MemoryDocType[]> {
    const db = await this.dbPromise;
    const docs = await db.memories
      .find({
        sort: [{ timestamp: "desc" }],
        limit,
      })
      .exec();

    return docs.map((doc) => doc.toJSON() as MemoryDocType);
  }

  async getAllEntries(): Promise<MemoryDocType[]> {
    const db = await this.dbPromise;
    const docs = await db.memories.find().exec();
    return docs.map((doc) => doc.toJSON() as MemoryDocType);
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
