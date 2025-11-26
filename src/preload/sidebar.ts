import { contextBridge } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

interface ChatRequest {
  message: string;
  context: {
    url: string | null;
    content: string | null;
    text: string | null;
  };
  messageId: string;
}

interface ChatResponse {
  messageId: string;
  content: string;
  isComplete: boolean;
}

interface CoreMessage {
  role: "user" | "assistant" | "system";
  content: unknown;
}

// Sidebar specific APIs
const sidebarAPI = {
  // Chat functionality
  sendChatMessage: (request: Partial<ChatRequest>) =>
    electronAPI.ipcRenderer.invoke("sidebar-chat-message", request),

  clearChat: () => electronAPI.ipcRenderer.invoke("sidebar-clear-chat"),

  getMessages: () => electronAPI.ipcRenderer.invoke("sidebar-get-messages"),

  onChatResponse: (callback: (data: ChatResponse) => void) => {
    electronAPI.ipcRenderer.on("chat-response", (_, data) => callback(data));
  },

  onMessagesUpdated: (callback: (messages: CoreMessage[]) => void) => {
    electronAPI.ipcRenderer.on("chat-messages-updated", (_, messages) =>
      callback(messages),
    );
  },

  removeChatResponseListener: () => {
    electronAPI.ipcRenderer.removeAllListeners("chat-response");
  },

  removeMessagesUpdatedListener: () => {
    electronAPI.ipcRenderer.removeAllListeners("chat-messages-updated");
  },

  // Suggestions
  onSuggestion: (callback: (suggestion: unknown) => void) => {
    electronAPI.ipcRenderer.on("proactive-suggestion", (_, suggestion) =>
      callback(suggestion),
    );
  },

  removeSuggestionListener: () => {
    electronAPI.ipcRenderer.removeAllListeners("proactive-suggestion");
  },

  acceptSuggestion: (id: string) =>
    electronAPI.ipcRenderer.invoke("suggestion:accept", id),

  rejectSuggestion: (id: string) =>
    electronAPI.ipcRenderer.invoke("suggestion:reject", id),

  // Memory + telemetry viewers
  listMemories: (options?: unknown) =>
    electronAPI.ipcRenderer.invoke("memories:list", options),
  listTelemetry: (options?: unknown) =>
    electronAPI.ipcRenderer.invoke("telemetry:list", options),

  openUrlInNewTab: (url: string) =>
    electronAPI.ipcRenderer.invoke("create-tab", url),

  // Page content access
  getPageContent: () => electronAPI.ipcRenderer.invoke("get-page-content"),
  getPageText: () => electronAPI.ipcRenderer.invoke("get-page-text"),
  getCurrentUrl: () => electronAPI.ipcRenderer.invoke("get-current-url"),

  // Tab information
  getActiveTabInfo: () => electronAPI.ipcRenderer.invoke("get-active-tab-info"),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("sidebarAPI", sidebarAPI);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.sidebarAPI = sidebarAPI;
}
