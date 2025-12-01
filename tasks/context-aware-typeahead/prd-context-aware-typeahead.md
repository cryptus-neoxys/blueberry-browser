# Product Requirements Document: Context-Aware Typeahead

## 1. Introduction

This document outlines the requirements for a "Grok-like" context-aware typeahead system for the Blueberry Browser AI Sidebar. The feature aims to provide intelligent, real-time suggestions to the user as they type in the chat input, leveraging local context (chat history, browser tabs) to predict intent and accelerate interaction.

## 2. Goals

- **Enhance Typing Efficiency**: Reduce keystrokes by offering relevant completions and queries.
- **Contextual Intelligence**: Suggestions must be relevant to the _current_ conversation and _active_ browsing context.
- **Premium UX**: Implement a polished, "Grok-like" UI (dropdown) that feels responsive and modern.
- **Local-First Performance**: Ensure low-latency (<50ms) feedback using local algorithms, minimizing reliance on external APIs.

## 3. User Stories

- **US1**: As a user typing "sum" while reading a news article, I see a suggestion "Summarize this page" in a dropdown.
- **US2**: As a user asking follow-up questions, I see suggestions based on the previous messages in the current chat (e.g., completing a sentence referring to a previously mentioned topic).
- **US3**: As a user, I can navigate the suggestions using my keyboard (Arrow keys) and select one with the Tab key.

## 4. Functional Requirements

### 4.1. User Interface

- **Dropdown Menu**: A sleek, dark-mode compatible dropdown list appearing _below_ or _above_ the chat input field (depending on space). **IMP**: Max 6 suggestions.
- **Visual Style**: Mimic the "Grok" aesthetic – clean typography, subtle highlighting of the selected item, distinct separation from the rest of the UI.
- **Interaction**:
  - Appears as the user types (min 2-3 words, debounced efficiently).
  - Keyboard navigation (Up/Down arrows to highlight, Tab to select).
  - Mouse click to select.
  - **Selection Behavior**: Populates the input field with the suggestion text. (Do Not auto-submit, default to populate).

### 4.2. Data Sources (Context Scope)

The typeahead engine will aggregate data from:

1.  **Current Chat History**: Messages from the _active_ conversation session only.
2.  **Active Tab**: Text content and metadata (URL, title) from the currently visible tab.
3.  **Open Tabs**: Titles of all other currently open tabs.

### 4.3. Suggestion Logic (Hybrid Approach)

The system will use a balanced hybrid approach for performance and relevance:

- **Layer 1: Fast Prefix Matching (Trie/Heuristics)**
  - **Mechanism**: In-memory Trie or simple prefix filtering.
  - **Source**: Vocabulary built from open tab titles and recent chat keywords.
  - **Latency**: <10ms (Instant).
- **Layer 2: Semantic Suggestions (Async Embeddings)**
  - **Mechanism**: Vector similarity search using `MemoryService`.
  - **Source**: Semantic matches against the current tab content and chat context.
  - **Latency**: Async (updates dropdown as results arrive).

### 4.4. Constraints & Out of Scope

- **Out of Scope**:
  - Direct execution of "Agentic Actions" (e.g., clicking buttons on a page) from the dropdown _for this MVP_.
  - Searching the entire historical database of all past conversations.
  - "Ghost text" inline completion (UI will be dropdown-only).
- **Constraint**: Must run efficiently in the renderer process or a dedicated worker, without blocking the UI thread.

## 5. Non-Goals

- Replacing the existing `SuggestionToast` (which serves as a proactive "nudge"). This feature is reactive to user typing, and completely separate from proactive suggestions.
- Cloud-based auto-complete APIs. But we can definitely download models from cloud/cdn which can run efficiently in-browser.

## 6. Technical Considerations

- **Integration**:
  - Modify `SidebarApp.tsx` to include the Typeahead component.
  - Utilize `MemoryService.ts` for embedding generation and search.
- **State Management**:
  - Need a local store (React State or Context) to hold the temporary vocabulary for the Trie.
  - Per chat session must be stored in accessible separately, either add chat_id column, store in a separate per-chat session store/file, but this is important. Using a column makes the most sense as the chats are already stored using the MemoryService, we'll just index the chat_id column.
- **Performance**:
  - Debounce the semantic search calls to avoid flooding.
  - Ensure the dropdown rendering is virtualized if the list is long (though likely capped at ~5-10 items).

## 7. Success Metrics

- **Latency**: Prefix matches appear in under 50ms.
- **Engagement**: User selects a suggestion in >20% of interactions.
- **Visuals**: UI matches the provided "Grok" reference images.

## 8. Open Questions

- None.
