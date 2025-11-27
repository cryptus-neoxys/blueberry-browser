import { useState, useEffect, useCallback } from "react";
import { Suggestion } from "../../../common/types";

interface UseSuggestionsResult {
  suggestions: Suggestion[];
  acceptSuggestion: (id: string) => Promise<void>;
  rejectSuggestion: (id: string) => Promise<void>;
  dismissSuggestion: (id: string) => void;
}

export const useSuggestions = (): UseSuggestionsResult => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    const handleSuggestion = (data: unknown): void => {
      const suggestion = data as Suggestion;
      // Avoid duplicates
      setSuggestions((prev) => {
        if (prev.some((s) => s.id === suggestion.id)) return prev;
        return [...prev, suggestion];
      });
    };

    window.sidebarAPI.onSuggestion(handleSuggestion);

    return () => {
      window.sidebarAPI.removeSuggestionListener();
    };
  }, []);

  const acceptSuggestion = useCallback(async (id: string) => {
    try {
      await window.sidebarAPI.acceptSuggestion(id);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to accept suggestion:", error);
    }
  }, []);

  const rejectSuggestion = useCallback(async (id: string) => {
    try {
      await window.sidebarAPI.rejectSuggestion(id);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to reject suggestion:", error);
    }
  }, []);

  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    suggestions,
    acceptSuggestion,
    rejectSuggestion,
    dismissSuggestion,
  };
};
