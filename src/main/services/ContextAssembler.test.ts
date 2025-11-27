import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContextAssembler } from "./ContextAssembler";
import { Window } from "../Window";

// Mock dependencies
vi.mock("../Window");
vi.mock("../Tab");
vi.mock("./TelemetryService", () => ({
  TelemetryService: class {
    getRecentEvents = vi.fn().mockResolvedValue([]);
  },
}));

describe("ContextAssembler", () => {
  let contextAssembler: ContextAssembler;
  let mockWindow: Window;

  beforeEach(() => {
    contextAssembler = new ContextAssembler();
    mockWindow = new Window() as unknown as Window;
    contextAssembler.setWindow(mockWindow);
  });

  describe("getOpenTabs", () => {
    it("should include domain in tab context", async () => {
      const mockTabs = [
        {
          id: "tab-1",
          title: "Google",
          url: "https://www.google.com",
        },
        {
          id: "tab-2",
          title: "GitHub",
          url: "https://github.com",
        },
      ];

      // Mock window.allTabs getter
      Object.defineProperty(mockWindow, "allTabs", {
        get: () => mockTabs,
      });

      // Mock window.activeTab getter
      Object.defineProperty(mockWindow, "activeTab", {
        get: () => mockTabs[0],
      });

      const snapshot = await contextAssembler.assemble();

      expect(snapshot.openTabs).toHaveLength(2);
      expect(snapshot.openTabs[0]).toEqual({
        id: "tab-1",
        title: "Google",
        url: "https://www.google.com",
        domain: "www.google.com",
        isActive: true,
      });
      expect(snapshot.openTabs[1]).toEqual({
        id: "tab-2",
        title: "GitHub",
        url: "https://github.com",
        domain: "github.com",
        isActive: false,
      });
    });
  });
});
