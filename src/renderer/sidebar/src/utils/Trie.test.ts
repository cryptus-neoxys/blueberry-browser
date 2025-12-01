import { describe, it, expect, beforeEach } from "vitest";
import { Trie } from "./Trie";

describe("Trie", () => {
  let trie: Trie;

  beforeEach(() => {
    trie = new Trie();
  });

  it("should insert and search words", () => {
    trie.insert("hello");
    expect(trie.search("hello")).toBe(true);
    expect(trie.search("hell")).toBe(false);
    expect(trie.search("helloo")).toBe(false);
  });

  it("should handle case insensitivity", () => {
    trie.insert("Hello");
    expect(trie.search("hello")).toBe(true);
    expect(trie.search("HELLO")).toBe(true);
  });

  it("should return completions for a prefix", () => {
    trie.insert("apple");
    trie.insert("app");
    trie.insert("application");
    trie.insert("banana");

    const completions = trie.getCompletions("app");
    expect(completions).toContain("app");
    expect(completions).toContain("apple");
    expect(completions).toContain("application");
    expect(completions).not.toContain("banana");
  });

  it("should respect the limit", () => {
    trie.insert("a");
    trie.insert("ab");
    trie.insert("abc");
    trie.insert("abcd");

    const completions = trie.getCompletions("a", 2);
    expect(completions.length).toBe(2);
  });

  it("should rank by score", () => {
    trie.insert("common", 10);
    trie.insert("rare", 1);
    trie.insert("commonplace", 5);

    // "common" (10) > "commonplace" (5)
    const completions = trie.getCompletions("comm");
    expect(completions[0]).toBe("common");
    expect(completions[1]).toBe("commonplace");
  });

  it("should return empty array for non-existent prefix", () => {
    trie.insert("hello");
    expect(trie.getCompletions("xyz")).toEqual([]);
  });
});
