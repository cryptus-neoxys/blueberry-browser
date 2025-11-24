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
- [ ] 1.0 Extend memory data services and persistence for viewer + telemetry retention (this isn't mandatory, if it is too much work, don't add retention, or add it in a simpler way that will not break things!)
  - [ ] 1.1 Update `MemoryService` with pagination, filters (type/date/search), and metadata projections for viewer needs
  - [ ] 1.2 Add telemetry retention storage (LRU cap 2,000 records) or document chosen simplified approach if deferred
  - [ ] 1.3 Expose new IPC handlers in `EventManager` for listing memories/telemetry, with preload typings
  - [ ] 1.4 Write unit/integration tests for new data APIs (MemoryService + telemetry store)
- [ ] 2.0 Build sidebar memory viewer UI/UX with filtering and deep links
  - [ ] 2.1 Add header icon + panel shell in sidebar app to toggle memory viewer
  - [ ] 2.2 Implement paginated list view with filters and search UI wired to IPC APIs
  - [ ] 2.3 Create detail view (drawer/modal) showing full memory entry, metadata, and open-in-tab link
  - [ ] 2.4 Add empty/error/loading states and unit/UI tests
- [ ] 3.0 Enhance suggestion engine (PatternDetectionService) and telemetry ingestion
  - [ ] 3.1 Capture tab telemetry (last 500+ events) and store with retention rules
  - [ ] 3.2 Expand pattern heuristics + LLM prompts to generate structured suggestions referencing capability manifest
  - [ ] 3.3 Rank suggestions by confidence/benefit and map to memory/telemetry IDs for traceability
  - [ ] 3.4 Add tests covering new heuristics and data pipelines
- [ ] 4.0 Implement actionable suggestion panel, confirmation UX, and IPC plumbing
  - [ ] 4.1 Add sidebar icon + panel listing suggestions with confidence badges and trace links
  - [ ] 4.2 Build review modal showing planned steps, affected tabs/forms, and data sources
  - [ ] 4.3 Wire approve/cancel flow via IPC to main process; include status updates in chat/suggestions panel
  - [ ] 4.4 Handle errors + dismissed suggestions, add accompanying tests
- [ ] 5.0 Create action execution framework, capability manifest, and audit logging
  - [ ] 5.1 Define JSON schema + manifest of supported capabilities (tab grouping, closing, form fill)
  - [ ] 5.2 Implement `ActionExecutor` service with validation, execution, and rollback hooks
  - [ ] 5.3 Log every action (request, approval, outcome) to RxDB audit collection and expose queries for UI
  - [ ] 5.4 Cover executor + manifest with automated tests and mocked browser APIs
- [ ] 6.0 QA, performance validation, and documentation updates
  - [ ] 6.1 Run manual QA: memory viewer performance, suggestion refresh cycles, action execution paths
  - [ ] 6.2 Add/update docs (README/PRD/task file) describing new icons, IPC APIs, and action tooling
  - [ ] 6.3 Ensure lint/tests pass, collect artifacts/screenshots for release notes
