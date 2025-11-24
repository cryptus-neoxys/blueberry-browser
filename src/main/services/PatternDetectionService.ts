import { MemoryService } from "./MemoryService";
import { MemoryDocType } from "../database/schema";
import { EventManager } from "../EventManager";

export interface Suggestion {
  id: string;
  type: "navigation" | "form-fill" | "search" | "other";
  title: string;
  description: string;
  action: {
    type: "navigate" | "fill-form" | "search";
    data: string | Record<string, unknown>; // URL for navigate, form data for fill-form, query for search
  };
  confidence: number; // 0-1
  timestamp: number;
}

export class PatternDetectionService {
  private memoryService: MemoryService;
  private eventManager: EventManager;
  private lastAnalysis: number = 0;
  private analysisInterval: number = 5 * 60 * 1000; // 5 minutes

  constructor(memoryService: MemoryService, eventManager: EventManager) {
    this.memoryService = memoryService;
    this.eventManager = eventManager;
  }

  /**
   * Analyze recent memory entries for patterns and generate suggestions
   */
  async analyzePatterns(): Promise<Suggestion[]> {
    const now = Date.now();
    if (now - this.lastAnalysis < this.analysisInterval) {
      return [];
    }
    this.lastAnalysis = now;

    const recentEntries = await this.memoryService.queryEntries(50); // Last 50 entries

    const suggestions: Suggestion[] = [];

    // Simple heuristic: If user frequently visits certain sites, suggest them
    const siteVisits = this.analyzeSiteVisits(recentEntries);
    suggestions.push(...siteVisits);

    // If user searches for similar things, suggest related searches
    const searchPatterns = this.analyzeSearchPatterns();
    suggestions.push(...searchPatterns);

    // If user fills forms similarly, suggest form fills
    const formPatterns = this.analyzeFormPatterns();
    suggestions.push(...formPatterns);

    return suggestions.filter((s) => s.confidence > 0.5); // Only high confidence
  }

  private analyzeSiteVisits(entries: MemoryDocType[]): Suggestion[] {
    const siteCounts: { [url: string]: number } = {};
    entries.forEach((entry) => {
      if (
        entry.type === "page" &&
        entry.metadata &&
        typeof (entry.metadata as { url?: unknown }).url === "string"
      ) {
        const domain = new URL((entry.metadata as { url: string }).url)
          .hostname;
        siteCounts[domain] = (siteCounts[domain] || 0) + 1;
      }
    });

    return Object.entries(siteCounts)
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([domain, count]) => ({
        id: `site-${domain}`,
        type: "navigation" as const,
        title: `Visit ${domain}`,
        description: `You've visited ${domain} ${count} times recently`,
        action: {
          type: "navigate" as const,
          data: `https://${domain}`,
        },
        confidence: Math.min(count / 10, 1),
        timestamp: Date.now(),
      }));
  }

  private analyzeSearchPatterns(): Suggestion[] {
    // Placeholder for search pattern analysis
    return [];
  }

  private analyzeFormPatterns(): Suggestion[] {
    // Placeholder for form pattern analysis
    return [];
  }

  /**
   * Trigger analysis after new memory entry
   */
  async onNewEntry(): Promise<void> {
    const suggestions = await this.analyzePatterns();
    if (suggestions.length > 0) {
      // Emit IPC event
      this.eventManager.sendToSidebar("proactive-suggestion", suggestions);
    }
  }
}
