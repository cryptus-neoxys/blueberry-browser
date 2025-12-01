export class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  score: number; // For ranking suggestions

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.score = 0;
  }
}

export class Trie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string, score: number = 0): void {
    let current = this.root;
    const lowerWord = word.toLowerCase();

    for (const char of lowerWord) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }
    current.isEndOfWord = true;
    current.score = Math.max(current.score, score);
  }

  search(word: string): boolean {
    let current = this.root;
    const lowerWord = word.toLowerCase();

    for (const char of lowerWord) {
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char)!;
    }
    return current.isEndOfWord;
  }

  getCompletions(prefix: string, limit: number = 5): string[] {
    let current = this.root;
    const lowerPrefix = prefix.toLowerCase();

    // Navigate to the end of the prefix
    for (const char of lowerPrefix) {
      if (!current.children.has(char)) {
        return [];
      }
      current = current.children.get(char)!;
    }

    // Collect all words from this point
    const completions: Array<{ word: string; score: number }> = [];
    this.collectWords(current, prefix, completions);

    // Sort by score (desc) then length (asc)
    return completions
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.word.length - b.word.length;
      })
      .slice(0, limit)
      .map((c) => c.word);
  }

  private collectWords(
    node: TrieNode,
    prefix: string,
    results: Array<{ word: string; score: number }>,
  ): void {
    if (node.isEndOfWord) {
      results.push({ word: prefix, score: node.score });
    }

    for (const [char, child] of node.children.entries()) {
      this.collectWords(child, prefix + char, results);
    }
  }
}
