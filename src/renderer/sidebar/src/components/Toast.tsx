import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../../../common/components/Button";

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

interface ToastProps {
  suggestion: Suggestion;
  onDismiss: () => void;
  onAction: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  suggestion,
  onDismiss,
  onAction,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = (): void => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Allow animation
  };

  const handleAction = (): void => {
    onAction();
    handleDismiss();
  };

  return (
    <div
      className={`fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {suggestion.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {suggestion.description}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={16} />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={handleAction} size="sm">
          {suggestion.action.type === "navigate" ? "Go" : "Apply"}
        </Button>
        <Button onClick={handleDismiss} variant="outline" size="sm">
          Dismiss
        </Button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  suggestions: Suggestion[];
  onDismiss: (id: string) => void;
  onAction: (suggestion: Suggestion) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  suggestions,
  onDismiss,
  onAction,
}) => {
  return (
    <>
      {suggestions.map((suggestion) => (
        <Toast
          key={suggestion.id}
          suggestion={suggestion}
          onDismiss={() => onDismiss(suggestion.id)}
          onAction={() => onAction(suggestion)}
        />
      ))}
    </>
  );
};
