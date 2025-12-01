import React, { useEffect, useRef } from "react";
import { cn } from "@common/lib/utils";

interface TypeaheadDropdownProps {
  suggestions: string[];
  selectedIndex: number;
  onSelect: (suggestion: string) => void;
}

export const TypeaheadDropdown: React.FC<TypeaheadDropdownProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
}) => {
  const listRef = useRef<HTMLUListElement>(null);

  console.log("[TypeaheadDropdown] Rendering with suggestions:", suggestions);

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (suggestions.length === 0) return null;

  return (
    <div className="w-full bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
      <ul ref={listRef} className="py-2 max-h-64 overflow-y-auto">
        {suggestions.map((suggestion, index) => (
          <li
            key={index}
            className={cn(
              "px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 flex items-center gap-3",
              index === selectedIndex
                ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
            onClick={() => onSelect(suggestion)}
            onMouseDown={(e) => e.preventDefault()}
          >
            <span className="opacity-50 text-xs">
              {/* Icon placeholder or simple dot */}●
            </span>
            {suggestion}
          </li>
        ))}
      </ul>
    </div>
  );
};
