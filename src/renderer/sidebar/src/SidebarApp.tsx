import React, { useEffect, useState } from "react";
import { MessageSquare, Brain } from "lucide-react";
import { ChatProvider } from "./contexts/ChatProvider";
import { Chat } from "./components/Chat";
import { MemoryViewer } from "./components/MemoryViewer";
import { useDarkMode } from "@common/hooks/useDarkMode";
import { SuggestionToast } from "./components/SuggestionToast";
import { useSuggestions } from "./hooks/useSuggestions";
import { cn } from "@common/lib/utils";

type View = "chat" | "memories";

const SidebarContent: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const { suggestions, acceptSuggestion, rejectSuggestion, dismissSuggestion } =
    useSuggestions();
  const [activeView, setActiveView] = useState<View>("chat");

  // Apply dark mode class to the document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <h1 className="font-semibold text-sm">Blueberry AI</h1>
        </div>
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveView("chat")}
            className={cn(
              "p-1.5 rounded-md transition-all",
              activeView === "chat"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveView("memories")}
            className={cn(
              "p-1.5 rounded-md transition-all",
              activeView === "memories"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Memories"
          >
            <Brain className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeView === "chat" ? <Chat /> : <MemoryViewer />}

        {/* Suggestions Overlay */}
        <div className="absolute bottom-0 right-0 p-4 pointer-events-none flex flex-col gap-2 items-end">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="pointer-events-auto">
              <SuggestionToast
                suggestion={suggestion}
                onAccept={acceptSuggestion}
                onReject={rejectSuggestion}
                onDismiss={dismissSuggestion}
              />
            </div>
          ))}
        </div>
      </div>
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
