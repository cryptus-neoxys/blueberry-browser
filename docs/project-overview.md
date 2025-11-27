## Project Overview

Blueberry Browser is an Electron-based browser with integrated AI chat and **personal memory layer** for task automation. It uses a **multi-window architecture** with three separate renderer processes:

- **TopBar**: Tab management and address bar UI (React)
- **Sidebar**: AI chat interface with LLM integration + memory viewer (React)
- **Tab Views**: Browser tabs using Electron's WebContentsView (vanilla web content)

## Architecture Patterns

### Multi-Window Setup

The app uses Electron's `BaseWindow` + `WebContentsView` architecture (not BrowserWindow):

- `Window.ts` orchestrates a single `BaseWindow` containing multiple child views
- `TopBar.ts` and `SideBar.ts` are React apps loaded as separate WebContentsViews
- `Tab.ts` instances are pure web views (no React) displaying browsed content
- All views are positioned via `setBounds()` and managed by the main `Window` class

### IPC Communication Pattern

- **Preload scripts**: `src/preload/topbar.ts` and `src/preload/sidebar.ts` expose typed APIs via `contextBridge`
- **EventManager**: Centralized IPC handler in `src/main/EventManager.ts` - all `ipcMain.handle()` calls live here
  - Group handlers by domain (tabs, chat, memories, telemetry) using private methods
  - Always call `registerHandler()` to prevent duplicate handler errors
- **React Contexts**: BrowserProvider (topbar) and ChatProvider (sidebar) consume preload APIs and manage local state
- Tabs update via polling (refresh callbacks), not push notifications

### LLM Integration

- `LLMClient.ts` supports both OpenAI and Anthropic via Vercel AI SDK
- Automatically captures **screenshots** of active tab and includes in chat context
- **RAG-enhanced chat**: Queries `MemoryService` for semantically similar past memories before responding
- Streams responses token-by-token using `streamText()` from `ai` package
- Messages stored in-memory; screenshots embedded as base64 data URIs
- Configure via `.env`: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`, `LLM_PROVIDER`, `LLM_MODEL`

### Memory, Persistence and Action Layer

- **RxDB with Dexie adapter**: IndexedDB-backed collections for memories and telemetry
  - Schema definitions in `src/main/database/schema.ts` use RxDB typed schemas
  - Database instance created once via `src/main/database/index.ts` singleton pattern
- **MemoryService**: Stores chat messages and page captures with embeddings for semantic search
  - `addEntry()` auto-generates embeddings via `EmbeddingService` (transformers.js)
  - `listEntries()` supports pagination, type/date filters, and text search
  - `findRelevant()` performs cosine similarity search for RAG context
- **TelemetryService**: Tracks tab events (navigation, memory capture) with LRU retention (2k cap)
  - `recordEvent()` logs tab activity; `enforceRetention()` prunes oldest entries
  - Telemetry data used by `PatternDetectionService` for proactive suggestions
- **PatternDetectionService**: Analyzes memory/telemetry to generate actionable suggestions
  - Emits `proactive-suggestion` events to sidebar via EventManager
  - Suggestions rendered as toasts in sidebar UI

## Key Developer Workflows

### Running the App

```bash
pnpm install          # First time setup
pnpm dev              # Dev mode with hot reload
pnpm build            # Production build
pnpm build:win        # Build Windows installer
pnpm test             # Run vitest unit tests
pnpm lint             # Run eslint
```

### Testing

- **Unit tests**: Vitest with `fake-indexeddb` for RxDB mocking
- Place tests alongside source: `MyService.ts` → `MyService.test.ts`
- Database services require `beforeAll(async () => await createDatabase())` setup
- Run specific test file: `pnpm test MemoryService` or `pnpm test TelemetryService`

### Project Structure

```
src/
  main/
    EventManager.ts        # IPC handler orchestration
    LLMClient.ts           # AI streaming + RAG context assembly
    Window.ts, Tab.ts      # View management
    database/
      schema.ts            # RxDB typed schemas (memories, telemetry)
      index.ts             # Database singleton
    services/
      MemoryService.ts     # Persistence + semantic search
      TelemetryService.ts  # Event logging + retention
      EmbeddingService.ts  # Transformers.js for embeddings
      PatternDetectionService.ts  # Suggestion generation
  preload/
    topbar.ts, sidebar.ts  # Context bridge APIs
    *.d.ts                 # TypeScript interface definitions
  renderer/
    common/                # Shared React components and hooks
    topbar/                # Tab bar + address bar React app
    sidebar/               # Chat interface + memory viewer React app
```

### Build System

- Uses `electron-vite` for all compilation
- **Two preload scripts** and **two renderer entries** configured in `electron.vite.config.ts`
- Tailwind CSS with CSS variables for theming (see `tailwind.config.js`)
- TypeScript with three configs: `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`
- Path aliases: `@common` → `src/renderer/common`, `@renderer` → `src/renderer/src`

## Project-Specific Conventions

### State Management

- **No Redux/Zustand**: Context API only (BrowserContext, ChatContext)
- Topbar and sidebar contexts are **isolated** - they don't share state directly
- Main process is source of truth; renderers query via IPC handles

### Styling

- Tailwind with `@common/lib/utils.ts` providing `cn()` helper (clsx + tailwind-merge)
- Dark mode toggled via `useDarkMode` hook, stored in localStorage
- CSS variables define theme (e.g., `rgb(var(--background) / <alpha-value>)`)

### Tab Operations

All tab methods return promises and accept tab IDs:

```typescript
// From topbar renderer:
await window.topBarAPI.navigateTab(tabId, url);
await window.topBarAPI.tabScreenshot(tabId);
await window.topBarAPI.tabRunJs(tabId, "return document.title");
```

### Adding New IPC Handlers

1. Add handler in `EventManager.ts` method (e.g., `handleTabEvents()` or `handleMemoryViewerEvents()`)
2. Use `this.registerHandler(channel, handler)` to prevent duplicate registration errors
3. Expose in appropriate preload script (`topbar.ts` or `sidebar.ts`)
4. Add TypeScript definitions in `.d.ts` file (`topbar.d.ts` or `sidebar.d.ts`)
5. Consume via context providers in React

Example flow for adding `memories:list`:

```typescript
// EventManager.ts
private handleMemoryViewerEvents(): void {
  this.registerHandler("memories:list", async (_, options) => {
    const memoryService = new MemoryService();
    return await memoryService.listEntries(options);
  });
}

// sidebar.ts
listMemories: (options) => ipcRenderer.invoke("memories:list", options),

// sidebar.d.ts
listMemories: (options: MemoryListOptions) => Promise<MemoryListResult>;
```

## Critical Implementation Details

### Window Layout

- TopBar height: **88px** (40px tabs + 48px toolbar)
- Sidebar width: **400px** (right edge)
- Tabs fill remaining space: `{x: 0, y: 88, width: bounds.width - 400, height: bounds.height - 88}`
- Resize handler in `Window.ts` updates all child view bounds

### LLM Context Assembly

The `LLMClient.prepareMessagesWithContext()` method automatically:

1. Captures screenshot of active tab (base64 data URI)
2. Extracts page text via `executeJavaScript('document.documentElement.innerText')`
3. Queries `MemoryService.findRelevant()` for semantically similar past memories (RAG)
4. Includes current URL and relevant memories in system message
5. Prepends system prompt defining assistant capabilities

Example RAG integration:

```typescript
const relevantMemories = await this.memoryService.findRelevant(userMessage, 5);
const memoryContext = relevantMemories
  .map((m) => `- ${m.content.slice(0, 200)}...`)
  .join("\n");
// Include in system message for context-aware responses
```

### Tab View Sandboxing

Tab WebContentsViews use strict security:

```typescript
{
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,         // Tabs are sandboxed
  webSecurity: true
}
```

TopBar/Sidebar must set `sandbox: false` for preload scripts to work.

## Common Gotchas

- **Circular dependencies**: `LLMClient` receives `Window` reference via `setWindow()` after construction
- **Bounds updates**: Must manually call `updateBounds()` on TopBar/SideBar/Tabs after window resize
- **Tab visibility**: Use `tab.show()`/`tab.hide()` - switching tabs hides old, shows new
- **IPC return values**: All IPC handlers return serializable data; NativeImage becomes data URI
- **Dev vs Production URLs**: Check `is.dev` to load from Vite dev server vs built files
- **Database initialization**: Services using RxDB must await `getDatabase()` before queries
- **Embedding generation**: `EmbeddingService` is a singleton - use `getInstance()` not `new`
- **Telemetry retention**: `TelemetryService.enforceRetention()` runs automatically; cap is 2,000 records

## External Dependencies

- `ai` + `@ai-sdk/openai` + `@ai-sdk/anthropic`: LLM providers via Vercel AI SDK
- `rxdb` + `dexie`: IndexedDB persistence with typed schemas
- `@xenova/transformers`: Client-side embeddings (gte-small model)
- `lucide-react`: Icon library
- `react-markdown` + `remark-gfm`: Markdown rendering in chat
- `class-variance-authority`: Component variant styling (CVA pattern)
- `@electron-toolkit/utils`: Electron dev/prod detection and app ID helpers
- `vitest` + `fake-indexeddb`: Unit testing with mocked database
