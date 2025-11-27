import React, { useEffect, useState, useCallback } from "react";
import { BrowserContext, type BrowserContextType } from "./BrowserContext";

interface TabInfo {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
}

export const BrowserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const activeTab = tabs.find((tab) => tab.isActive) || null;

  const refreshTabs = useCallback(async () => {
    try {
      const tabsData = await window.topBarAPI.getTabs();
      setTabs(tabsData);
    } catch (error) {
      console.error("Failed to refresh tabs:", error);
    }
  }, []);

  useEffect(() => {
    const handleTabsUpdated = (updatedTabs: TabInfo[]): void => {
      setTabs(updatedTabs);
    };

    window.topBarAPI.onTabsUpdated(handleTabsUpdated);

    return () => {
      window.topBarAPI.removeTabsUpdatedListener();
    };
  }, []);

  const createTab = useCallback(async (url?: string) => {
    setIsLoading(true);
    try {
      await window.topBarAPI.createTab(url);
    } catch (error) {
      console.error("Failed to create tab:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeTab = useCallback(async (tabId: string) => {
    setIsLoading(true);
    try {
      await window.topBarAPI.closeTab(tabId);
    } catch (error) {
      console.error("Failed to close tab:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchTab = useCallback(async (tabId: string) => {
    setIsLoading(true);
    try {
      await window.topBarAPI.switchTab(tabId);
    } catch (error) {
      console.error("Failed to switch tab:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const navigateToUrl = useCallback(
    async (url: string) => {
      if (!activeTab) return;

      setIsLoading(true);
      try {
        await window.topBarAPI.navigateTab(activeTab.id, url);
      } catch (error) {
        console.error("Failed to navigate:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab],
  );

  const goBack = useCallback(async () => {
    if (!activeTab) return;

    try {
      await window.topBarAPI.goBack(activeTab.id);
    } catch (error) {
      console.error("Failed to go back:", error);
    }
  }, [activeTab]);

  const goForward = useCallback(async () => {
    if (!activeTab) return;

    try {
      await window.topBarAPI.goForward(activeTab.id);
    } catch (error) {
      console.error("Failed to go forward:", error);
    }
  }, [activeTab]);

  const reload = useCallback(async () => {
    if (!activeTab) return;

    try {
      await window.topBarAPI.reload(activeTab.id);
    } catch (error) {
      console.error("Failed to reload:", error);
    }
  }, [activeTab]);

  const takeScreenshot = useCallback(async (tabId: string) => {
    try {
      return await window.topBarAPI.tabScreenshot(tabId);
    } catch (error) {
      console.error("Failed to take screenshot:", error);
      return null;
    }
  }, []);

  const runJavaScript = useCallback(async (tabId: string, code: string) => {
    try {
      return await window.topBarAPI.tabRunJs(tabId, code);
    } catch (error) {
      console.error("Failed to run JavaScript:", error);
      return null;
    }
  }, []);

  // Initialize tabs on mount
  useEffect(() => {
    refreshTabs();
  }, [refreshTabs]);

  const value: BrowserContextType = {
    tabs,
    activeTab,
    isLoading,
    createTab,
    closeTab,
    switchTab,
    refreshTabs,
    navigateToUrl,
    goBack,
    goForward,
    reload,
    takeScreenshot,
    runJavaScript,
  };

  return (
    <BrowserContext.Provider value={value}>{children}</BrowserContext.Provider>
  );
};
