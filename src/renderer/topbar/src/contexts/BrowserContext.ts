import { createContext } from "react";

interface TabInfo {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
}

export interface BrowserContextType {
  tabs: TabInfo[];
  activeTab: TabInfo | null;
  isLoading: boolean;
  createTab: (url?: string) => Promise<void>;
  closeTab: (tabId: string) => Promise<void>;
  switchTab: (tabId: string) => Promise<void>;
  refreshTabs: () => Promise<void>;
  navigateToUrl: (url: string) => Promise<void>;
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
  reload: () => Promise<void>;
  takeScreenshot: (tabId: string) => Promise<string | null>;
  runJavaScript: (tabId: string, code: string) => Promise<unknown>;
}

export const BrowserContext = createContext<BrowserContextType | null>(null);
