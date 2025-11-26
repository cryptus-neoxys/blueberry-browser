import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MemoryViewer } from "../MemoryViewer";

type SidebarAPI = Window["sidebarAPI"];

const createSidebarAPIMock = (): SidebarAPI => ({
  sendChatMessage: vi.fn().mockResolvedValue(undefined),
  clearChat: vi.fn().mockResolvedValue(undefined),
  getMessages: vi.fn().mockResolvedValue([]),
  onChatResponse: vi.fn(),
  onMessagesUpdated: vi.fn(),
  removeChatResponseListener: vi.fn(),
  removeMessagesUpdatedListener: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  listMemories: vi
    .fn()
    .mockResolvedValue({ entries: [], total: 0, hasMore: false }),
  listTelemetry: vi
    .fn()
    .mockResolvedValue({ entries: [], total: 0, hasMore: false }),
  openUrlInNewTab: vi.fn().mockResolvedValue(undefined),
  getPageContent: vi.fn().mockResolvedValue(null),
  getPageText: vi.fn().mockResolvedValue(null),
  getCurrentUrl: vi.fn().mockResolvedValue(null),
  getActiveTabInfo: vi.fn().mockResolvedValue(null),
  onSuggestion: vi.fn(),
  removeSuggestionListener: vi.fn(),
  acceptSuggestion: vi.fn().mockResolvedValue(undefined),
  rejectSuggestion: vi.fn().mockResolvedValue(undefined),
});

describe("MemoryViewer", () => {
  let originalSidebarAPI: SidebarAPI | undefined;
  let mockSidebarAPI: SidebarAPI;

  beforeEach(() => {
    originalSidebarAPI = window.sidebarAPI;
    mockSidebarAPI = createSidebarAPIMock();
    window.sidebarAPI = mockSidebarAPI;
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.sidebarAPI = originalSidebarAPI ?? mockSidebarAPI;
  });

  it("renders empty state when no memories are returned", async () => {
    mockSidebarAPI.listMemories = vi
      .fn()
      .mockResolvedValue({ entries: [], total: 0, hasMore: false });

    render(<MemoryViewer debounceMs={0} />);

    expect(await screen.findByText(/no memories/i)).toBeInTheDocument();
    expect(mockSidebarAPI.listMemories).toHaveBeenCalled();
  });

  it("shows memory detail view when a memory is selected", async () => {
    const timestamp = Date.now();
    const sampleMemory = {
      id: "1",
      content: "Investigate financial report",
      type: "page" as const,
      metadata: { url: "https://example.com/report" },
      timestamp,
    };

    mockSidebarAPI.listMemories = vi
      .fn()
      .mockResolvedValue({ entries: [sampleMemory], total: 1, hasMore: false });

    render(<MemoryViewer debounceMs={0} />);

    fireEvent.click(await screen.findByText(/Investigate financial report/i));

    expect(screen.getByText(/Memory Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Metadata/i)).toBeInTheDocument();

    const openButton = screen.getByRole("button", {
      name: /open original page/i,
    });
    fireEvent.click(openButton);

    expect(mockSidebarAPI.openUrlInNewTab).toHaveBeenCalledWith(
      "https://example.com/report",
    );
  });
});
