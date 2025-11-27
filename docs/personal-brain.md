# Personal Brain & Contextual Workflow Automation

The "Personal Brain" is a local-first intelligence layer in Blueberry Browser that learns from user behavior to automate repetitive tasks. It consists of three main pillars: **Memory**, **Pattern Detection**, and **Action Execution**.

## 1. Memory Layer (RxDB)

The foundation of the Personal Brain is a local database that stores user interactions and context.

- **Storage**: Uses `RxDB` with `Dexie.js` (IndexedDB) adapter for persistent, local-only storage.
- **Collections**:
  - `memories`: Stores chat history, page summaries, and user notes. Supports vector embeddings for semantic search (RAG).
  - `telemetry`: Logs granular browser events (navigation, clicks, scroll) with a 2,000-record LRU retention policy.
  - `suggestions`: Tracks generated workflow suggestions and their states (pending, accepted, rejected).

### Key Services

- **`MemoryService`**: Handles CRUD operations for memories and performs vector similarity search.
- **`TelemetryService`**: Ingests high-frequency event data and manages retention.
- **`EmbeddingService`**: Generates local embeddings using `@xenova/transformers` (all-MiniLM-L6-v2) for privacy-preserving semantic search.

## 2. Contextual Workflow Automation (Pattern Detection)

The browser proactively analyzes user context to suggest helpful automations.

- **Context Assembly**: `ContextAssembler` aggregates the current state:
  - Open tabs (URLs, titles)
  - Recent telemetry (last 5 minutes of activity)
  - Active page content
- **LLM Analysis**: `PatternDetectionService` sends this context to the LLM (OpenAI/Anthropic) to identify patterns.
- **Workflow Generation**: The LLM returns a structured `Workflow` object containing a trigger context and a sequence of actions.
- **UI Presentation**: Suggestions appear as non-intrusive "Toasts" in the Sidebar. Users can "Accept" or "Reject" them.

### Workflow Structure

```typescript
interface Workflow {
  id: string;
  title: string;
  description: string;
  triggerContext: string; // Why this was suggested
  actions: Action[];
}

type Action =
  | { type: "navigate"; target: string }
  | { type: "click"; target: string; description?: string } // target is a CSS selector
  | { type: "input"; target: string; value: string }
  | { type: "wait"; duration: number };
```

## 3. Action Execution Engine

When a user accepts a suggestion, the `ActionExecutor` service takes over to perform the tasks.

- **Execution**: Runs in the Main process, utilizing Electron's `webContents` APIs.
- **Capabilities**:
  - `navigate`: Loads URLs in the active tab.
  - `click`: Injects JavaScript to find and click elements via CSS selectors.
  - `input`: Fills form fields.
  - `wait`: Handles timing delays between actions.
- **Security**: Actions are executed in the context of the active tab but orchestrated from the privileged Main process.

## Future Roadmap

- [ ] **Heuristic Triggers**: Add non-LLM triggers for common patterns (e.g., "You visit this site every morning").
- [ ] **Visual Action Recording**: Allow users to manually record macros by demonstrating actions.
- [ ] **Cross-Tab Workflows**: Support workflows that span multiple tabs or windows.
- [ ] **Cloud Sync (Optional)**: Encrypted sync of memories across devices.
