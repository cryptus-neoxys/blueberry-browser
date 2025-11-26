## Relevant Files

- `src/main/services/MemoryService.ts` - Extend querying, filtering, and pagination APIs for the memory viewer.
- `src/main/EventManager.ts` - Expose new IPC channels for memories, suggestions, and action execution.
- `src/preload/sidebar.ts` / `src/preload/sidebar.d.ts` - Surface new renderer APIs for the sidebar UI panels.
- `src/renderer/sidebar/src/components/*` - Implement memory viewer panel, suggestion panel, and confirmation modal.
- `src/main/services/PatternDetectionService.ts` - Expand suggestion generation logic and telemetry ingestion.
- `src/main/services/ActionExecutor.ts` (new) - Execute approved actions via browser/Electron capabilities with auditing.
- `src/main/database/schema.ts` & related RxDB files - Add collections/indexes for telemetry and audit logs.
- `src/main/index.ts` - Wire periodic refresh, telemetry retention caps, and service bootstrapping.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

## Tasks

- [x] 0.0 IMP: Don't Create feature branch, continue in this same branch
- [x] 1.0 Extend memory data services and persistence for viewer + telemetry retention (this isn't mandatory, if it is too much work, don't add retention, or add it in a simpler way that will not break things!)
  - [x] 1.1 Update `MemoryService` with pagination, filters (type/date/search), and metadata projections for viewer needs
  - [x] 1.2 Add telemetry retention storage (LRU cap 2,000 records) or document chosen simplified approach if deferred
  - [x] 1.3 Expose new IPC handlers in `EventManager` for listing memories/telemetry, with preload typings
  - [x] 1.4 Write unit/integration tests for new data APIs (MemoryService + telemetry store)
- [x] 2.0 Build sidebar memory viewer UI/UX with filtering and deep links
  - [x] 2.1 Add header icon + panel shell in sidebar app to toggle memory viewer
  - [x] 2.2 Implement paginated list view with filters and search UI wired to IPC APIs
  - [x] 2.3 Create detail view (drawer/modal) showing full memory entry, metadata, and open-in-tab link
  - [x] 2.4 Add empty/error/loading states and unit/UI tests
- [ ] 3.0 Implement Contextual Workflow Automation Engine (formerly Pattern Detection)
  - [x] 3.1 Capture tab telemetry (last 500+ events) and store with retention rules
- [x] Task 3.2: Implement `ContextAssembler` service to aggregate open tabs and telemetry
- [x] Task 3.3: Configure `LLMClient` with Zod schema for `Workflow` generation
- [x] Task 3.4: Update DB schema for `suggestions` collection to support state tracking (pending/accepted/rejected) and idempotency hashing
- [ ] Task 3.5: Refactor `PatternDetectionService` to use `ContextAssembler` and `LLMClient` for generation, and DB for state tracking
- [ ] Task 3.6: Add unit tests for `ContextAssembler` and `PatternDetectionService` (mocking LLM) (Skipped per user request)
- [x] Task 4.0: Frontend: Suggestion UI
  - [x] 4.1 Create `SuggestionToast` component in Sidebar
  - [x] 4.2 Implement `useSuggestions` hook to listen for `proactive-suggestion` events
  - [x] 4.3 Add "Accept" and "Reject" handlers that call backend IPC
- [x] Task 5.0: Action Execution Engine
  - [x] 5.1 Implement `ActionExecutor` service in main process
  - [x] 5.2 Handle `navigate`, `click`, `input` actions using Electron APIs
  - [x] 5.3 Connect "Accept" IPC to `ActionExecutor`
- [x] Task 6.0: QA, performance validation, and documentation updates
  - [x] 6.1 Add/update docs (PRD/task file) describing new icons, IPC APIs, and action tooling
  - [x] 6.2 Ensure lint/tests pass, collect artifacts/screenshots for release notes
  - [x] 6.3 Run manual QA: memory viewer performance, suggestion refresh cycles, action execution paths
