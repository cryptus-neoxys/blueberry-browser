import { ipcMain, WebContents } from "electron";
import type { Window } from "./Window";

export class EventManager {
  private mainWindow: Window;
  private registeredHandlers: string[] = [];

  constructor(mainWindow: Window) {
    this.mainWindow = mainWindow;
    this.setupEventHandlers();
  }

  private registerHandler(
    channel: string,
    handler: Parameters<typeof ipcMain.handle>[1],
  ): void {
    // Remove existing handler if any to prevent "Attempted to register a second handler" error
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
    this.registeredHandlers.push(channel);
  }

  private setupEventHandlers(): void {
    // Tab management events
    this.handleTabEvents();

    // Sidebar events
    this.handleSidebarEvents();

    // Page content events
    this.handlePageContentEvents();

    // Dark mode events
    this.handleDarkModeEvents();

    // Debug events
    this.handleDebugEvents();
  }

  private handleTabEvents(): void {
    // Create new tab
    this.registerHandler("create-tab", (_, url?: string) => {
      const newTab = this.mainWindow.createTab(url);
      return { id: newTab.id, title: newTab.title, url: newTab.url };
    });

    // Close tab
    this.registerHandler("close-tab", (_, id: string) => {
      this.mainWindow.closeTab(id);
    });

    // Switch tab
    this.registerHandler("switch-tab", (_, id: string) => {
      this.mainWindow.switchActiveTab(id);
    });

    // Get tabs
    this.registerHandler("get-tabs", () => {
      const activeTabId = this.mainWindow.activeTab?.id;
      return this.mainWindow.allTabs.map((tab) => ({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        isActive: activeTabId === tab.id,
      }));
    });

    // Navigation (for compatibility with existing code)
    this.registerHandler("navigate-to", (_, url: string) => {
      if (this.mainWindow.activeTab) {
        this.mainWindow.activeTab.loadURL(url);
      }
    });

    this.registerHandler(
      "navigate-tab",
      async (_, tabId: string, url: string) => {
        const tab = this.mainWindow.getTab(tabId);
        if (tab) {
          await tab.loadURL(url);
          return true;
        }
        return false;
      },
    );

    this.registerHandler("go-back", () => {
      if (this.mainWindow.activeTab) {
        this.mainWindow.activeTab.goBack();
      }
    });

    this.registerHandler("go-forward", () => {
      if (this.mainWindow.activeTab) {
        this.mainWindow.activeTab.goForward();
      }
    });

    this.registerHandler("reload", () => {
      if (this.mainWindow.activeTab) {
        this.mainWindow.activeTab.reload();
      }
    });

    // Tab-specific navigation handlers
    this.registerHandler("tab-go-back", (_, tabId: string) => {
      const tab = this.mainWindow.getTab(tabId);
      if (tab) {
        tab.goBack();
        return true;
      }
      return false;
    });

    this.registerHandler("tab-go-forward", (_, tabId: string) => {
      const tab = this.mainWindow.getTab(tabId);
      if (tab) {
        tab.goForward();
        return true;
      }
      return false;
    });

    this.registerHandler("tab-reload", (_, tabId: string) => {
      const tab = this.mainWindow.getTab(tabId);
      if (tab) {
        tab.reload();
        return true;
      }
      return false;
    });

    this.registerHandler("tab-screenshot", async (_, tabId: string) => {
      const tab = this.mainWindow.getTab(tabId);
      if (tab) {
        const image = await tab.screenshot();
        return image.toDataURL();
      }
      return null;
    });

    this.registerHandler(
      "tab-run-js",
      async (_, tabId: string, code: string) => {
        const tab = this.mainWindow.getTab(tabId);
        if (tab) {
          return await tab.runJs(code);
        }
        return null;
      },
    );

    // Tab info
    this.registerHandler("get-active-tab-info", () => {
      const activeTab = this.mainWindow.activeTab;
      if (activeTab) {
        return {
          id: activeTab.id,
          url: activeTab.url,
          title: activeTab.title,
          canGoBack: activeTab.webContents.canGoBack(),
          canGoForward: activeTab.webContents.canGoForward(),
        };
      }
      return null;
    });
  }

  private handleSidebarEvents(): void {
    // Toggle sidebar
    this.registerHandler("toggle-sidebar", () => {
      this.mainWindow.sidebar.toggle();
      this.mainWindow.updateAllBounds();
      return true;
    });

    // Chat message
    this.registerHandler("sidebar-chat-message", async (_, request) => {
      // The LLMClient now handles getting the screenshot and context directly
      await this.mainWindow.sidebar.client.sendChatMessage(request);
    });

    // Clear chat
    this.registerHandler("sidebar-clear-chat", () => {
      this.mainWindow.sidebar.client.clearMessages();
      return true;
    });

    // Get messages
    this.registerHandler("sidebar-get-messages", () => {
      return this.mainWindow.sidebar.client.getMessages();
    });
  }

  private handlePageContentEvents(): void {
    // Get page content
    this.registerHandler("get-page-content", async () => {
      if (this.mainWindow.activeTab) {
        try {
          return await this.mainWindow.activeTab.getTabHtml();
        } catch (error) {
          console.error("Error getting page content:", error);
          return null;
        }
      }
      return null;
    });

    // Get page text
    this.registerHandler("get-page-text", async () => {
      if (this.mainWindow.activeTab) {
        try {
          return await this.mainWindow.activeTab.getTabText();
        } catch (error) {
          console.error("Error getting page text:", error);
          return null;
        }
      }
      return null;
    });

    // Get current URL
    this.registerHandler("get-current-url", () => {
      if (this.mainWindow.activeTab) {
        return this.mainWindow.activeTab.url;
      }
      return null;
    });
  }

  private handleDarkModeEvents(): void {
    // Dark mode broadcasting
    ipcMain.on("dark-mode-changed", (event, isDarkMode) => {
      this.broadcastDarkMode(event.sender, isDarkMode);
    });
  }

  private handleDebugEvents(): void {
    // Ping test
    ipcMain.on("ping", () => console.log("pong"));
  }

  private broadcastDarkMode(sender: WebContents, isDarkMode: boolean): void {
    // Send to topbar
    if (this.mainWindow.topBar.view.webContents !== sender) {
      this.mainWindow.topBar.view.webContents.send(
        "dark-mode-updated",
        isDarkMode,
      );
    }

    // Send to sidebar
    if (this.mainWindow.sidebar.view.webContents !== sender) {
      this.mainWindow.sidebar.view.webContents.send(
        "dark-mode-updated",
        isDarkMode,
      );
    }

    // Send to all tabs
    this.mainWindow.allTabs.forEach((tab) => {
      if (tab.webContents !== sender) {
        tab.webContents.send("dark-mode-updated", isDarkMode);
      }
    });
  }

  // Clean up event listeners and handlers
  public cleanup(): void {
    // Remove all registered handlers
    this.registeredHandlers.forEach((channel) => {
      ipcMain.removeHandler(channel);
    });
    this.registeredHandlers = [];

    // Remove listeners
    ipcMain.removeAllListeners();
  }
}
