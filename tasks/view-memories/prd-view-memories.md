# PRD: Sidebar Memory Viewer & Action Suggestions

## 1. Overview

Users need a transparent way to inspect saved browsing/chat memories and act on emerging patterns directly inside the sidebar. This feature adds quick-access icons at the top of the sidebar to open (a) a complete memory viewer and (b) a similar automation suggestion quick-access viewer. The system will continuously learn from stored memories (pages + chats) and recent browser telemetry, suggest high-confidence automations (e.g., grouping tabs, closing unused tabs, filling repetitive forms), and execute them after explicit user confirmation via a structured action/tool-calling framework.

## 2. Goals

- Provide a chronological, fully detailed list of stored memories (timestamps, URLs, excerpts) accessible from sidebar chat.
- Surface actionable automations derived from memory + telemetry patterns with clear benefits and confidence scores.
- Execute supported automations (tab management, form fills, navigation/playback) through a standardized action framework with confirmation modals.
- Maintain traceability between suggested actions and the underlying signals (memories/telemetry) to build trust.

## 3. User Stories

1. As a power user, I can click the "Memories" icon in the sidebar header to review my saved browsing/chats with timestamps and snippets.
2. As the same user, I can open the "Suggestions" icon to see recommended actions (group tabs, close unused ones, auto-fill forms) ranked by confidence and benefit.
3. Before running an action, I see a modal/extended-view detailing the exact steps/tools the browser will invoke and can approve or cancel.
4. After approving, the browser executes the workflow (via Electron APIs) and confirms completion or errors back in the sidebar.
5. I can trace any suggestion back to the relevant memory entries or telemetry that triggered it. (this traceability/auditability is important as we have transparency as a priority for the user and UX)

## 4. Functional Requirements

1. **Memory Viewer Panel**
   1.1. Icon button in sidebar header toggles a drawer/panel displaying a chronological list of memory entries with timestamp, type (chat/page), URL (if any), and 200-char excerpt.
   1.2. Provide filters (type, date range, keyword search over indexed content).
   1.3. Selecting an entry expands full content and metadata, with link to open the URL in a new tab if applicable.

2. **Suggestion Panel**
   2.1. Adjacent icon opens a panel listing current actionable suggestions with title, description, confidence, and estimated benefit.
   2.2. Suggestions are ranked by confidence but all plausible actions that meet minimum threshold are displayed.
   2.3. Each suggestion links to source signals (memory IDs, telemetry summary).

3. **Action Framework**
   3.1. Suggestions map to a capability manifest (Electron/browser APIs) for tab grouping, closing unused tabs, and guided form filling.
   3.2. Clicking "Review" opens a modal/extended-view summarizing the plan: steps, tabs affected, form fields and data sources (ie memory traces which triggered this action suggestion).
   3.3. User must approve the suggestion before execution; quick actions are not allowed.
   3.4. Execution layer logs success/failure and posts status updates to sidebar chat + suggestion panel.

4. **Suggestion Engine**
   4.1. Consumes entire memory DB plus browser telemetry (list of last 500 tabs, dwell time, activity markers) to derive patterns.
   4.2. Uses confidence ranking; show top results but allow additional lower-confidence actions if relevant.
   4.3. Supports initial actions: tab grouping by domain/topic, closing unused tabs (idle > configurable threshold), auto-filling recognized forms with previously entered data.
   4.4. Suggestions refresh every 5 minutes and after new memory entries or telemetry updates.

5. **Tool/Action Schema**
   5.1. Define JSON schema describing the action (type, parameters, required capabilities, preconditions, rollback steps).
   5.2. Integrate with LLM tool-calling interface so LLM outputs follow schema and system validates before execution.
   5.3. Capability adapter translates schema into Electron IPC calls (e.g., `groupTabs`, `closeTab`, `fillForm`).

6. **Audit & History**
   6.1. Log every executed action with timestamp, parameters, initiator, outcome; store in a local audit collection.
   6.2. Provide quick link from suggestion panel to recent actions for transparency.

## 5. Non-Goals

- No desktop-wide automation beyond browser scope in this release.
- No automatic execution without user approval.
- No integration with external data sources (calendar, email) yet; future scope only.
- No rewriting of existing memory capture pipeline beyond exposing viewer APIs.

## 6. Design Considerations

- Sidebar header gains two icon buttons (Memories, Suggestions) with tooltips and active states.
- Panels can slide over existing chat area or open as stacked drawers; ensure responsive layout for narrow sidebar width.
- Use existing `Toast` styles for confirmation feedback; maintain dark-mode compatibility.

## 7. Technical Considerations

- **Data Access**: Extend `MemoryService` with pagination/filter queries; expose via IPC to sidebar renderer.
- **Telemetry Capture**: Add lightweight tab activity logger (store in Dexie/RxDB or in-memory ring buffer) accessible to suggestion engine.
- **Suggestion Engine**: Update `PatternDetectionService` to leverage LLM + heuristics, outputting structured action objects referencing capability manifest.
- **Tool Calling**: Use Vercel AI SDK tool-calling; ensure schema validated before execution.
- **Execution Layer**: Implement `ActionExecutor` in main process that maps actions to existing browser controls (tab manager, form filler). Ensure operations are atomic or have rollback where possible.
- **IPC Updates**: New channels for `memories:list`, `suggestions:list`, `actions:execute`, `actions:status`.
- **Security**: Sanitize LLM outputs; Ensure proper guardrails; Properly engineered prompts with security guidelines; Enforce structured output; enforce whitelist of allowed commands/targets. Prevent form fills on non-HTTPS sites unless user overrides.

## 8. Success Metrics

- ≥80% of memory viewer sessions load under 200ms for last 100 entries.
- At least 50% of suggested actions result in approvals within first week of availability among beta users.
- Reduce average open-tab count by 20% for users who accept tab management suggestions.
- Zero unauthorized actions executed (all logged approvals).

## 9. Open Questions

1. Should we allow bulk approval of multiple suggestions at once? **No** – each automation requires individual review/confirmation for transparency.
2. What retention window should the telemetry (last 500 tabs) respect for privacy? **Configurable cap with LRU eviction** – allow up to 2,000 combined records (chats, tabs, history) for suggestion generation; remove oldest items first when the cap is exceeded.
3. How do we gather training data for form auto-fill without storing sensitive inputs? **Store each unique field value once with user consent** – prompt for new fields, then cache them securely for future autofill suggestions.
4. Should the memory viewer support exporting entries (CSV/JSON)? **No** – exporting is out of scope to minimize data leakage risk.
5. Future (5D): integration with external sources—what priority and timeline? **None for now** – defer until core browser automation proves value.
