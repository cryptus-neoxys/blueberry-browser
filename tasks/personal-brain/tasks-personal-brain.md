# Tasks: Personal Brain - Local-First Memory Layer

## Relevant Files

- `src/main/database/schema.ts` - RxDB schema definitions for memory entries
- `src/main/database/index.ts` - Database initialization and RxDB setup
- `src/main/services/EmbeddingService.ts` - Service for generating embeddings using @xenova/transformers
- `src/main/services/MemoryService.ts` - Core service for adding/retrieving memory entries
- `src/main/services/PatternDetectionService.ts` - Service for analyzing user behavior patterns
- `src/main/EventManager.ts` - Updates to handle new IPC events for memory
- `src/main/LLMClient.ts` - Updates to integrate memory retrieval into chat context
- `src/preload/sidebar.ts` - Expose new memory-related APIs
- `src/renderer/sidebar/src/components/Toast.tsx` - New component for proactive suggestions

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch `feat/memory-layer-for-task-automation` (Already done)
- [x] 1.0 Setup RxDB & Hybrid Storage Infrastructure
  - [x] 1.1 Install dependencies: `rxdb` (if needed, or just `rxdb`), `rxjs`, `dexie`, `rx-storage-dexie` (Already done)
  - [x] 1.2 Create `src/main/database/schema.ts` defining the memory schema (id, content, embedding, type, metadata, timestamp)
  - [x] 1.3 Create `src/main/database/index.ts` to initialize RxDB with Dexie storage adapter
  - [x] 1.4 Implement a basic `addEntry` and `queryEntries` method in a new `MemoryService` class (`src/main/services/MemoryService.ts`) to verify DB connectivity
- [x] 2.0 Implement Embedding Service & Data Capture
  - [x] 2.1 Install `@xenova/transformers`
  - [x] 2.2 Create `src/main/services/EmbeddingService.ts` to handle loading the model and generating embeddings
  - [x] 2.3 Update `MemoryService` to generate embeddings for content before saving to RxDB
  - [x] 2.4 Update `EventManager.ts` to listen for "chat-complete" events and call `MemoryService.addEntry`
  - [x] 2.5 Update `Tab.ts` or `EventManager.ts` to listen for "did-finish-load" events, extract page text, and call `MemoryService.addEntry`
- [x] 3.0 Integrate Memory with LLM Context (RAG) in chat SideBar
  - [x] 3.1 Implement vector search in `MemoryService` (using RxDB or manual cosine similarity if RxDB vector search isn't available/free) to find top-5 relevant chunks
  - [x] 3.2 Update `LLMClient.ts` to query `MemoryService` for relevant context based on the user's message
  - [x] 3.3 Prepend retrieved context to the system prompt or user message in `LLMClient.ts`
- [x] 4.0 Implement Pattern Detection & Proactive Suggestions
  - [x] 4.1 Create `src/main/services/PatternDetectionService.ts`
  - [x] 4.2 Implement a method to analyze recent memory entries for patterns (simple heuristic or LLM-based)
  - [x] 4.3 Set up a 5-minute interval in `index.ts` or `EventManager.ts` to trigger pattern detection
  - [x] 4.4 Also trigger pattern detection after every `MemoryService.addEntry` call
  - [x] 4.5 Define a "Suggestion" type and an IPC event `proactive-suggestion` to send suggestions to the renderer
- [x] 5.0 UI Integration & Testing
  - [x] 5.1 Create a `Toast` component in `src/renderer/sidebar/src/components/Toast.tsx` (or reuse existing notification system if available)
  - [x] 5.2 Update `SidebarApp.tsx` or a global context to listen for `proactive-suggestion` events and display the toast
  - [x] 5.3 Verify that clicking the toast triggers the suggested action (e.g., filling a form, navigating to a URL - _Note: Action execution logic might need to be defined in `PatternDetectionService`_)
  - [x] 5.4 Perform end-to-end testing: Browse -> Chat -> Verify Memory Storage -> Verify RAG Context -> Verify Proactive Suggestions
