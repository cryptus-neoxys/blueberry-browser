import { getDatabase, MyDatabase } from "../database";
import { MemoryDocType } from "../database/schema";
import { randomUUID } from "crypto";

export class MemoryService {
  private dbPromise: Promise<MyDatabase>;

  constructor() {
    this.dbPromise = getDatabase();
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

    const doc = await db.memories.insert({
      id,
      content,
      type,
      metadata,
      timestamp,
      embedding,
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
