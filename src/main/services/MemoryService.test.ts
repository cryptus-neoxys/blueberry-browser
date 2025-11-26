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

  it("should filter memory entries by type", async () => {
    const service = new MemoryService();

    await service.addEntry("page entry", "page");
    await service.addEntry("chat entry", "chat");

    const result = await service.listEntries({ type: "page" });

    expect(result.entries.every((entry) => entry.type === "page")).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(result.entries.length);
  });

  it("should search memory entries by content", async () => {
    const service = new MemoryService();

    await service.addEntry("This is a unique needle", "chat");
    await service.addEntry("Completely different text", "chat");

    const result = await service.listEntries({ search: "needle" });

    expect(result.entries.length).toBeGreaterThanOrEqual(1);
    expect(result.entries[0].content).toContain("needle");
  });
});
