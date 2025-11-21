import { describe, it, expect, beforeAll } from "vitest";
import { createDatabase } from "../database";
import { MemoryService } from "./MemoryService";

// TODO: cryptus-neoxys - Mock the database for isolated unit tests
// ref: https://dexie.org/docs/DexieErrors/Dexie.MissingAPIError
describe("MemoryService", () => {
  beforeAll(async () => {
    // Ensure database is initialized before tests run
    await createDatabase();
  });

  it("should add a memory entry", async () => {
    const service = new MemoryService();

    const result = await service.addEntry("hello world", "chat", {
      source: "test",
    });

    expect(result.id).toBeDefined();
    expect(result.content).toBe("hello world");
    expect(result.type).toBe("chat");
    expect(typeof result.timestamp).toBe("number");
  });

  it("should query memory entries in descending timestamp order", async () => {
    const service = new MemoryService();

    await service.addEntry("first", "chat", { order: 1 });
    await service.addEntry("second", "chat", { order: 2 });

    const entries = await service.queryEntries(2);

    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(entries[0].timestamp).toBeGreaterThanOrEqual(entries[1].timestamp);
  });
});
