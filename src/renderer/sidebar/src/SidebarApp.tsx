import React, { useEffect, useState } from "react";
import { MessageSquare, Brain } from "lucide-react";
import { ChatProvider } from "./contexts/ChatProvider";
import { Chat } from "./components/Chat";
import { MemoryViewer } from "./components/MemoryViewer";
import { useDarkMode } from "@common/hooks/useDarkMode";
import { ToastContainer } from "./components/Toast";
import { cn } from "@common/lib/utils";

interface Suggestion {
  id: string;
  type: "navigation" | "form-fill" | "search" | "other";
  title: string;
  description: string;
  action: {
    type: "navigate" | "fill-form" | "search";
    data: string | Record<string, unknown>;
  };
  confidence: number;
  timestamp: number;
}

type View = "chat" | "memories";

const SidebarContent: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeView, setActiveView] = useState<View>("chat");

  // Apply dark mode class to the document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Listen for proactive suggestions
  useEffect(() => {
    const handleSuggestion = (...args: unknown[]): void => {
      const newSuggestions = args[1] as Suggestion[];
      setSuggestions((prev) => [...prev, ...newSuggestions]);
    };

    window.sidebarAPI.on("proactive-suggestion", handleSuggestion);

    return () => {
      window.sidebarAPI.off("proactive-suggestion", handleSuggestion);
    };
  }, []);

  const handleDismiss = (id: string): void => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAction = (suggestion: Suggestion): void => {
    // For now, just log. Later implement actual actions.
    console.log("Action triggered:", suggestion);
    // If navigate, perhaps send to topbar to navigate.
    // For now, dismiss.
  };

  return (
    <div className="h-screen flex flex-col bg-background border-l border-border">
      {/* Header / Navigation */}
      <div className="flex items-center p-2 border-b border-border bg-muted/30">
        <div className="flex p-1 bg-muted rounded-lg">
          <button
            onClick={() => setActiveView("chat")}
            className={cn(
              "p-2 rounded-md transition-colors",
              activeView === "chat"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Chat"
          >
            <MessageSquare size={18} />
          </button>
          <button
            onClick={() => setActiveView("memories")}
            className={cn(
              "p-2 rounded-md transition-colors",
              activeView === "memories"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Memories"
          >
            <Brain size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeView === "chat" ? <Chat /> : <MemoryViewer />}
      </div>

      <ToastContainer
        suggestions={suggestions}
        onDismiss={handleDismiss}
        onAction={handleAction}
      />
    </div>
  );
};

export const SidebarApp: React.FC = () => {
  return (
    <ChatProvider>
      <SidebarContent />
    </ChatProvider>
  );
};
