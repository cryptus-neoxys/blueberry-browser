import React, { useEffect, useState } from "react";
import {
  Search,
  FileText,
  MessageSquare,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@common/components/Button";

interface MemoryDoc {
  id: string;
  content: string;
  type: "chat" | "page";
  metadata?: Record<string, unknown>;
  timestamp: number;
}

interface MemoryListResult {
  entries: MemoryDoc[];
  total: number;
  hasMore: boolean;
}

const PAGE_SIZE = 50;

interface MemoryViewerProps {
  debounceMs?: number;
}

export const MemoryViewer: React.FC<MemoryViewerProps> = ({
  debounceMs = 300,
}) => {
  const [memories, setMemories] = useState<MemoryDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "chat" | "page">("all");
  const [selectedMemory, setSelectedMemory] = useState<MemoryDoc | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchMemories = async (reset = false): Promise<void> => {
    if (loading && !reset) return;

    setLoading(true);
    setError(null);

    try {
      const options: Record<string, unknown> = {
        limit: PAGE_SIZE,
        offset: reset ? 0 : offset,
      };

      const trimmedSearch = search.trim();
      if (trimmedSearch) {
        options.search = trimmedSearch;
      }

      if (typeFilter !== "all") {
        options.type = typeFilter;
      }

      const result = (await window.sidebarAPI.listMemories(
        options
      )) as MemoryListResult;

      if (reset) {
        setMemories(result.entries);
        setOffset(result.entries.length);
      } else {
        setMemories((prev) => [...prev, ...result.entries]);
        setOffset((prev) => prev + result.entries.length);
      }

      setHasMore(result.hasMore);
    } catch (err) {
      console.error("Failed to fetch memories", err);
      setError("Unable to load memories. Please try again.");
      if (reset) {
        setMemories([]);
        setOffset(0);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceMs === 0) {
      void fetchMemories(true);
      return;
    }

    const debounce = setTimeout(() => {
      void fetchMemories(true);
    }, debounceMs);

    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, debounceMs]);

  const handleLoadMore = (): void => {
    void fetchMemories(false);
  };

  const handleOpenOriginal = (url: string): void => {
    void window.sidebarAPI.openUrlInNewTab(url);
  };

  const renderEmptyState = (): React.JSX.Element => (
    <div className="text-center p-8 text-muted-foreground">
      {error ? (
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void fetchMemories(true);
            }}
          >
            Retry
          </Button>
        </div>
      ) : loading ? (
        <p>Loading memories...</p>
      ) : (
        <p>No memories found</p>
      )}
    </div>
  );

  if (selectedMemory) {
    const url = (selectedMemory.metadata as { url?: string })?.url;

    return (
      <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-4 duration-200">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <button
            onClick={() => setSelectedMemory(null)}
            className="p-1 hover:bg-accent rounded-md transition-colors"
            aria-label="Back to list"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="font-semibold">Memory Details</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {selectedMemory.type === "chat" ? (
                <MessageSquare size={14} />
              ) : (
                <FileText size={14} />
              )}
              <span>{new Date(selectedMemory.timestamp).toLocaleString()}</span>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm whitespace-pre-wrap">
              {selectedMemory.content}
            </div>
          </div>

          {url && (
            <Button
              className="w-full gap-2"
              onClick={() => handleOpenOriginal(url)}
            >
              <ExternalLink size={14} />
              Open Original Page
            </Button>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Metadata
            </h3>
            <pre className="p-3 rounded-md bg-muted text-xs overflow-x-auto">
              {JSON.stringify(selectedMemory.metadata ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border space-y-3">
        <h2 className="text-lg font-semibold">Memories</h2>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search memories..."
              className="w-full pl-8 pr-3 py-2 bg-muted rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="bg-muted rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as "all" | "chat" | "page")
            }
          >
            <option value="all">All Types</option>
            <option value="chat">Chat</option>
            <option value="page">Pages</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {memories.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {memories.map((memory) => (
              <div
                key={memory.id}
                onClick={() => setSelectedMemory(memory)}
                className="p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {memory.type === "chat" ? (
                      <MessageSquare size={12} />
                    ) : (
                      <FileText size={12} />
                    )}
                    <span>
                      {new Date(memory.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm line-clamp-3 text-card-foreground">
                  {memory.content}
                </p>
              </div>
            ))}
            {hasMore && (
              <div className="p-2 text-center">
                <Button
                  variant="ghost"
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
