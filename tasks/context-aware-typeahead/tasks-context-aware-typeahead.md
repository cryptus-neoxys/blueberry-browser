# Tasks: Context-Aware Typeahead

## Relevant Files

- `src/main/database/schema.ts` - Update Memory schema to include `chatId`.
- `src/main/services/MemoryService.ts` - Update to support `chatId` indexing and semantic search filtering.
- `src/renderer/sidebar/src/utils/Trie.ts` - New utility for fast prefix matching.
- `src/renderer/sidebar/src/utils/Trie.test.ts` - Unit tests for Trie.
- `src/renderer/sidebar/src/components/TypeaheadDropdown.tsx` - New component for the typeahead UI.
- `src/renderer/sidebar/src/hooks/useTypeahead.ts` - New hook for managing typeahead logic and state.
- `src/renderer/sidebar/src/components/Chat.tsx` - Integration with the chat input field.
- `src/renderer/sidebar/src/SidebarApp.tsx` - Integration point (if needed for global state).

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch `feature/context-aware-typeahead`

- [x] 1.0 Implement Data Layer Enhancements
  - [x] 1.1 Update `MEMORY_SCHEMA_LITERAL` in `src/main/database/schema.ts` to include `chatId` (string, indexed if possible or just a field).
  - [x] 1.2 Update `MemoryService.ts` `addEntry` method to accept `chatId` in metadata or as a top-level field.
  - [x] 1.3 Update `MemoryService.ts` `listEntries` and `searchSimilar` to support filtering by `chatId`.
  - [x] 1.4 Verify database migration/update works (or clear DB for dev).

- [ ] 2.0 Implement Local Trie & Prefix Matching
  - [ ] 2.1 Create `src/renderer/sidebar/src/utils/Trie.ts` with `insert`, `search`, and `getCompletions(prefix, limit)` methods.
  - [ ] 2.2 Create `src/renderer/sidebar/src/utils/Trie.test.ts` and add unit tests for prefix matching and completion ranking.
  - [ ] 2.3 Implement a `VocabularyService` or helper to extract keywords from open tabs and chat history to populate the Trie.

- [ ] 3.0 Build Basic Typeahead UI & Integrate with Chat Input
  - [ ] 3.1 Create `src/renderer/sidebar/src/components/TypeaheadDropdown.tsx` (Visual component only).
  - [ ] 3.2 Create `src/renderer/sidebar/src/hooks/useTypeahead.ts` to manage state (input value, suggestions list, selected index).
  - [ ] 3.3 Connect `useTypeahead` to the local Trie (from Task 2.0) for synchronous suggestions.
  - [ ] 3.4 Modify `ChatInput` in `src/renderer/sidebar/src/components/Chat.tsx` to render `TypeaheadDropdown` and bind keyboard events (ArrowUp, ArrowDown, Tab/Enter).
  - [ ] 3.5 Verify: Typing in Chat Input shows Trie-based suggestions from a mock vocabulary.

- [ ] 4.0 Implement Semantic Search Integration
  - [ ] 4.1 Update `useTypeahead.ts` to trigger debounced calls to `MemoryService.searchSimilar` (via IPC or direct service access if in renderer).
  - [ ] 4.2 Merge semantic results with Trie results in `useTypeahead.ts` (Prioritize Trie for exact matches, Semantic for context).
  - [ ] 4.3 Handle async loading states (optional subtle indicator).

- [ ] 5.0 Polish UI & Final Integration
  - [ ] 5.1 Apply "Grok-like" styling to `TypeaheadDropdown.tsx` (Dark mode, rounded corners, specific typography).
  - [ ] 5.2 Limit suggestions to max 6 items.
  - [ ] 5.3 Ensure `chatId` is correctly passed from the active chat session to `MemoryService` when sending messages.
  - [ ] 5.4 Final manual test: Verify suggestions appear from both History (Semantic) and Tab Titles (Trie).
