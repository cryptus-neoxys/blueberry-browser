import { useState, useCallback, useRef } from "react";
import { Trie } from "@kamilmielnik/trie";
import { useDebouncedCallback } from "./useDebounce";
import englishWords from "wordlist-english/english-words-20.json";

// Initialize Trie with English words
const trie = new Trie();
englishWords.forEach((word) => trie.add(word));

// Add some custom vocabulary
const CUSTOM_VOCABULARY = [
  "summarize this page",
  "summarize tab",
  "explain quantum computing",
  "find similar articles",
  "extract main points",
  "compare with previous tab",
  "what is the author saying",
  "translate to spanish",
  "save to notes",
  "email to team",
  "who is shah rukh khan",
  "who is the president",
];
CUSTOM_VOCABULARY.forEach((word) => trie.add(word));

interface TrieNode {
  wordEnd?: boolean;
  [key: string]: TrieNode | boolean | undefined;
}

// Helper to traverse Trie node and collect words (BFS for shortest matches first)
const getWordsFromNode = (
  node: TrieNode,
  prefix: string,
  limit: number
): string[] => {
  const words: string[] = [];
  // Queue stores { node, currentWord }
  const queue: { node: TrieNode; word: string }[] = [{ node, word: prefix }];

  while (queue.length > 0 && words.length < limit) {
    const item = queue.shift();
    if (!item) break;

    const { node: currNode, word: currWord } = item;

    if (currNode.wordEnd) {
      words.push(currWord);
    }

    // Sort keys to ensure deterministic order (optional, but good for UI)
    const keys = Object.keys(currNode)
      .filter((k) => k !== "wordEnd")
      .sort();

    for (const char of keys) {
      const child = currNode[char];
      if (typeof child === "object" && child !== null) {
        queue.push({ node: child as TrieNode, word: currWord + char });
      }
    }
  }
  return words;
};

export interface UseTypeaheadReturn {
  suggestions: string[];
  selectedIndex: number;
  isVisible: boolean;
  isLoading: boolean;
  search: (query: string) => void;
  moveSelection: (direction: "up" | "down") => void;
  selectCurrent: () => string | null;
  clear: () => void;
}

export const useTypeahead = (): UseTypeaheadReturn => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Use a ref to track the latest query to avoid race conditions
  const latestQueryRef = useRef("");

  const search = useCallback(async (query: string) => {
    console.log("[Typeahead] Searching for:", query);
    latestQueryRef.current = query;

    if (!query || query.length < 2) {
      setSuggestions([]);
      setIsVisible(false);
      return;
    }

    // 1. Get instant prefix matches from Trie
    // @kamilmielnik/trie uses 'find' to get the node for the prefix
    const trieNode = trie.find(query);
    console.log("[Typeahead] Trie node found:", !!trieNode);

    let trieResults: string[] = [];
    if (trieNode) {
      trieResults = getWordsFromNode(trieNode, query, 6);
    }

    console.log("[Typeahead] Trie results:", trieResults);

    // Update UI immediately with Trie results
    setSuggestions(trieResults);
    setIsVisible(trieResults.length > 0);
    setSelectedIndex(0);

    // 2. Trigger semantic search (debounced in a real app, or here if we want)
    // For MVP, we'll simulate an async call. In production, this calls MemoryService.
    // We only do this if we have fewer than 6 results from Trie
    if (trieResults.length < 6) {
      setIsLoading(true);
      try {
        // Simulate network delay
        // await new Promise(resolve => setTimeout(resolve, 300));

        // In a real implementation:
        // const semanticResults = await window.api.memory.searchSimilar(query, 3, currentChatId);
        // const merged = [...new Set([...trieResults, ...semanticResults.map(r => r.content)])].slice(0, 6);

        // For now, just keep Trie results
        if (latestQueryRef.current === query) {
          // setSuggestions(merged);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Semantic search failed", err);
        setIsLoading(false);
      }
    }
  }, []);

  const debouncedSearch = useDebouncedCallback(search, 150);

  const moveSelection = useCallback(
    (direction: "up" | "down") => {
      if (!isVisible || suggestions.length === 0) return;

      setSelectedIndex((prev) => {
        if (direction === "down") {
          return prev < suggestions.length - 1 ? prev + 1 : 0;
        } else {
          return prev > 0 ? prev - 1 : suggestions.length - 1;
        }
      });
    },
    [isVisible, suggestions.length]
  );

  const selectCurrent = useCallback(() => {
    if (isVisible && selectedIndex >= 0 && suggestions[selectedIndex]) {
      return suggestions[selectedIndex];
    }
    return null;
  }, [isVisible, selectedIndex, suggestions]);

  const clear = useCallback(() => {
    setSuggestions([]);
    setIsVisible(false);
    setSelectedIndex(-1);
  }, []);

  return {
    suggestions,
    selectedIndex,
    isVisible,
    isLoading,
    search: debouncedSearch,
    moveSelection,
    selectCurrent,
    clear,
  };
};
