# PRD: Tab Management Agent (Grouping & Organization)

## 1. Introduction/Overview

This feature extends the existing "Personal Brain" and "Action Execution" systems to support intelligent tab management. Specifically, it enables the browser to proactively suggest and execute tab organization workflows, primarily focusing on **grouping related tabs** by reordering them in the tab strip.

The goal is to reduce tab clutter and cognitive load by automatically organizing tabs into logical clusters (e.g., "Work", "Shopping", "Social") based on their content and metadata, using the existing LLM-driven suggestion infrastructure.

## 2. Goals

- **Reduce Visual Clutter:** Automatically reorder tabs so related pages sit next to each other.
- **Proactive Assistance:** Detect disorganized states (e.g., scattered GitHub tabs) and suggest organization without user prompting.
- **Seamless Integration:** Use the existing `SuggestionToast` and `ActionExecutor` patterns.
- **Safety:** Ensure no data is lost; this feature strictly _reorders_ tabs, it does not close or hide them (for now).

## 3. User Stories

- **As a user with many open tabs**, I want the browser to notice when I have scattered tabs related to the same topic (e.g., 5 different Amazon product pages mixed with work tabs) and suggest grouping them.
- **As a user**, I want to click "Accept" on a "Group Tabs" suggestion and watch my tabs animate/move into a logical order.
- **As a user**, I want to see a clear explanation of _why_ the tabs are being grouped (e.g., "Group 4 Shopping Tabs").

## 4. Functional Requirements

### 4.1. Context Assembly Updates

- The `ContextAssembler` must provide richer tab data to the LLM to enable better clustering decisions.
- **Requirement 4.1.1:** Include `domain` in the tab context sent to the LLM.
- **Requirement 4.1.2:** (Optional/Future) Include `lastAccessed` timestamp if available to help with "stale tab" detection logic in the future.

### 4.2. Pattern Detection (LLM)

- **Requirement 4.2.1:** Update the system prompt in `LLMClient` (or `PatternDetectionService`) to recognize "disorganized tabs" as a triggerable pattern.
- **Requirement 4.2.2:** The LLM must be able to generate a `Workflow` with a new action type: `reorder-tabs`.
- **Requirement 4.2.3:** The logic should identify clusters based on:
  - Domain (e.g., all `github.com` tabs).
  - Topic (e.g., `stackoverflow.com` and `github.com` might both be "Dev").

### 4.3. Action Execution

- **Requirement 4.3.1:** Implement a new action type `reorder-tabs` in `ActionExecutor`.
- **Requirement 4.3.2:** The `reorder-tabs` action payload should specify the desired order, likely as a list of `tabId`s in their new sequence.
- **Requirement 4.3.3:** The `ActionExecutor` must call a new Main Process API (e.g., `window.moveTab(id, index)`) to physically rearrange the tabs in the `tabsMap` and UI.

### 4.4. UI/UX

- **Requirement 4.4.1:** No new UI components are strictly required; reuse the existing `SuggestionToast`.
- **Requirement 4.4.2:** The suggestion title should be descriptive (e.g., "Organize 5 Development Tabs").

## 5. Non-Goals (Out of Scope)

- **Visual Tab Groups:** We will NOT implement colored folders, collapsible groups, or "Chrome-style" visual groups in the UI. Grouping is purely spatial (reordering).
- **Closing Tabs:** Automated closing of tabs is out of scope for this iteration.
- **Workspaces:** We are not implementing separate workspaces or hiding tabs.
- **Pinning/Muting:** Out of scope.

## 6. Technical Considerations

- **Electron View Management:** Reordering tabs in the `TopBar` UI (React) must stay in sync with the `Window` class's internal `tabsMap` or list.
- **State Sync:** When `ActionExecutor` reorders tabs, it must emit an event to the `TopBar` renderer to update the React state immediately.
- **Idempotency:** If the user manually moves a tab while a suggestion is pending, the execution might fail or look weird. The `ActionExecutor` should verify tab existence before moving.

## 7. Success Metrics

- **Acceptance Rate:** % of "Group Tabs" suggestions accepted by the user.
- **Retention:** Users who accept a grouping suggestion continue to use the browser for X minutes (indicating they didn't get frustrated and leave).

## 8. Open Questions

- **Animation:** Does the current `TopBar` implementation support animated reordering? If not, the tabs might just "snap" into place. This is acceptable for v1.
- **Conflict:** What if the LLM suggests an order that conflicts with the user's pinned tabs (if we had them)? Assume no pinned tabs for now
