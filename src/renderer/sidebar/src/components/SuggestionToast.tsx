import React, { useState, useEffect } from "react";
import { X, Play, ThumbsDown } from "lucide-react";
import { Button } from "../../../common/components/Button";
import { Suggestion } from "../../../common/types";
import { cn } from "../../../common/lib/utils";

interface SuggestionToastProps {
  suggestion: Suggestion;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onDismiss: (id: string) => void;
}

export const SuggestionToast: React.FC<SuggestionToastProps> = ({
  suggestion,
  onAccept,
  onReject,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleDismiss = (): void => {
    setIsVisible(false);
    setTimeout(() => onDismiss(suggestion.id), 300);
  };

  const handleAccept = (): void => {
    setIsVisible(false);
    setTimeout(() => onAccept(suggestion.id), 300);
  };

  const handleReject = (): void => {
    setIsVisible(false);
    setTimeout(() => onReject(suggestion.id), 300);
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 w-80 bg-background border border-border rounded-lg shadow-lg p-4 transition-all duration-300 z-50",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              Suggestion
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(suggestion.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <h4 className="font-semibold text-sm">{suggestion.title}</h4>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        {suggestion.description}
      </p>

      <div className="text-xs bg-muted/50 p-2 rounded mb-3 space-y-1">
        <p className="font-medium text-muted-foreground">Planned Actions:</p>
        <ul className="list-disc list-inside text-muted-foreground">
          {suggestion.workflow.actions.slice(0, 2).map((action, i) => (
            <li key={i} className="truncate">
              {action.description}
            </li>
          ))}
          {suggestion.workflow.actions.length > 2 && (
            <li>+{suggestion.workflow.actions.length - 2} more actions</li>
          )}
        </ul>
      </div>

      <div className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1 gap-1"
          onClick={handleAccept}
        >
          <Play className="h-3 w-3" />
          Run Workflow
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={handleReject}
        >
          <ThumbsDown className="h-3 w-3" />
          Reject
        </Button>
      </div>
    </div>
  );
};
