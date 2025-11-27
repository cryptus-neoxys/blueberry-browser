## Relevant Files

- `src/main/services/ContextAssembler.ts` - Update to include tab domain and metadata in context snapshots.
- `src/main/LLMClient.ts` - Update system prompt to recognize tab clutter and generate `reorder-tabs` workflows.
- `src/main/services/ActionExecutor.ts` - Implement the `reorder-tabs` action logic.
- `src/main/Window.ts` - Add `moveTab(id, index)` method to physically reorder tabs in the main process.
- `src/main/EventManager.ts` - Expose `move-tab` or similar IPC if needed (though ActionExecutor runs in Main).
- `src/renderer/topbar/src/contexts/BrowserProvider.tsx` - Ensure tab list updates correctly when Main process reorders tabs.
- `src/main/types.ts` - Update `Action` and `Workflow` type definitions.

### Notes

- Unit tests should typically be placed alongside the code files they are testing.
- Use `npx jest [optional/path/to/test/file]` to run tests.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

## Tasks

- [x] 0.0 Continue in this feature feature. No Subtasks here
- [x] 1.0 Enhance Context Assembly
  - [x] 1.1 Update `TabContext` interface in `src/main/services/ContextAssembler.ts` to include a `domain` field
  - [x] 1.2 Implement a helper method to safely extract the hostname/domain from a tab's URL
  - [x] 1.3 Update `ContextAssembler.getOpenTabs()` to populate the `domain` field for each tab
  - [x] 1.4 Add/Update unit tests for `ContextAssembler` to verify correct domain extraction
- [x] 2.0 Update LLM Logic & Types
  - [x] 2.1 Update `Action` type definition in `src/main/types.ts` to include the `reorder-tabs` action (payload: `newOrder: string[]`)
  - [x] 2.2 Update `LLMClient.ts` system prompt to describe the "Tab Organization" capability and criteria for grouping (domain/topic)
  - [x] 2.3 Update the Zod schema in `LLMClient.ts` (if applicable) to validate the `reorder-tabs` action structure
- [x] 3.0 Implement Tab Reordering Logic (Main Process)
  - [x] 3.1 Add a `reorderTabs(newOrder: string[])` method to `src/main/Window.ts`
  - [x] 3.2 Implement logic in `Window.ts` to update the internal tabs order based on the provided ID list
  - [x] 3.3 Ensure `Window.ts` emits a `tabs-updated` or `tabs-reordered` event to the `TopBar` WebContents to trigger a UI refresh
- [x] 4.0 Implement Action Execution
  - [x] 4.1 Update `src/main/services/ActionExecutor.ts` to add a case for `reorder-tabs`
  - [x] 4.2 Implement the execution logic: call `window.reorderTabs()` with the provided order
  - [x] 4.3 Add validation to ignore invalid Tab IDs (e.g., tabs closed since the suggestion was generated)
- [x] 5.0 UI Sync & Verification
  - [x] 5.1 Verify `BrowserProvider.tsx` in `TopBar` correctly updates when the main process emits tab updates (ensure it listens to the event or polls frequently enough)
  - [x] 5.2 Manual QA: Open a chaotic set of tabs (e.g., 3x GitHub, 2x Google, 3x GitHub mixed), wait for suggestion, accept, and verify tabs are grouped by domain
