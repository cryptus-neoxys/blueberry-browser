import { useContext } from "react";
import { BrowserContext } from "../contexts/BrowserContext";
import type { BrowserContextType } from "../contexts/BrowserContext";

export const useBrowser = (): BrowserContextType => {
  const context = useContext(BrowserContext);
  if (!context) {
    throw new Error("useBrowser must be used within a BrowserProvider");
  }
  return context;
};
