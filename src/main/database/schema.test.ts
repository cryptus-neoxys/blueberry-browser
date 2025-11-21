import { describe, it, expect } from "vitest";
import { MEMORY_SCHEMA_LITERAL, memorySchema } from "./schema";

describe("memorySchema", () => {
  it("should have the expected primary key and required fields", () => {
    expect(MEMORY_SCHEMA_LITERAL.primaryKey).toBe("id");
    expect(MEMORY_SCHEMA_LITERAL.required).toEqual([
      "id",
      "content",
      "type",
      "timestamp",
    ]);
  });

  it("should be assignable to RxJsonSchema", () => {
    // Sanity check: exported schema matches the literal
    expect(memorySchema).toEqual(MEMORY_SCHEMA_LITERAL);
  });
});
