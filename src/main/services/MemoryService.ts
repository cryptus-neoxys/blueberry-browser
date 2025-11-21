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
    embedding: number[] = []
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
}
