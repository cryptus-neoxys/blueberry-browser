import { describe, it, expect } from "vitest";
import { extractDomain } from "./domainExtractor";

describe("extractDomain", () => {
  it("should extract hostname from standard URL", () => {
    expect(extractDomain("https://www.google.com/search?q=test")).toBe(
      "www.google.com",
    );
  });

  it("should extract hostname from URL without www", () => {
    expect(extractDomain("https://github.com/cryptus-neoxys")).toBe(
      "github.com",
    );
  });

  it("should return empty string for invalid URL", () => {
    expect(extractDomain("invalid-url")).toBe("");
  });

  it("should handle localhost", () => {
    expect(extractDomain("http://localhost:3000")).toBe("localhost");
  });
});
