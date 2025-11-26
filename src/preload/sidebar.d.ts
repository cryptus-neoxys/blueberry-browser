import { ElectronAPI } from "@electron-toolkit/preload";
import type {
  MemoryListOptions,
  MemoryListResult,
} from "../main/services/MemoryService";
import type {
  TelemetryListOptions,
  TelemetryListResult,
} from "../main/services/TelemetryService";

interface CoreMessage {
  role: "user" | "assistant" | "system";
  content: unknown;
}

interface ChatRequest {
  message: string;
  messageId: string;
}

interface ChatResponse {
  messageId: string;
  content: string;
  isComplete: boolean;
}

interface TabInfo {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
}

interface SidebarAPI {
  // Chat functionality
  sendChatMessage: (request: Partial<ChatRequest>) => Promise<void>;
  clearChat: () => Promise<void>;
  getMessages: () => Promise<CoreMessage[]>;
  onChatResponse: (callback: (data: ChatResponse) => void) => void;
  onMessagesUpdated: (callback: (messages: CoreMessage[]) => void) => void;
  removeChatResponseListener: () => void;
  removeMessagesUpdatedListener: () => void;

  // Proactive suggestions
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  off: (channel: string, callback: (...args: unknown[]) => void) => void;

  // Memory + telemetry viewers
  listMemories: (options?: MemoryListOptions) => Promise<MemoryListResult>;
  listTelemetry: (
    options?: TelemetryListOptions
  ) => Promise<TelemetryListResult>;
  openUrlInNewTab: (url: string) => Promise<unknown>;

  // Page content access
  getPageContent: () => Promise<string | null>;
  getPageText: () => Promise<string | null>;
  getCurrentUrl: () => Promise<string | null>;

  // Tab information
  getActiveTabInfo: () => Promise<TabInfo | null>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    sidebarAPI: SidebarAPI;
  }
}
