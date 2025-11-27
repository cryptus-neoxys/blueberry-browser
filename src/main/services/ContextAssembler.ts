import { Window } from "../Window";
import { TelemetryService } from "./TelemetryService";
import { TelemetryDocType } from "../database/schema";
import { extractDomain } from "../utils/domainExtractor";

export interface TabContext {
  id: string;
  title: string;
  url: string;
  domain: string;
  isActive: boolean;
}

export interface ContextSnapshot {
  openTabs: TabContext[];
  recentTelemetry: TelemetryDocType[];
  timestamp: number;
}

export class ContextAssembler {
  private window: Window | null = null;
  private telemetryService: TelemetryService;

  constructor() {
    this.telemetryService = new TelemetryService();
  }

  public setWindow(window: Window): void {
    this.window = window;
  }

  public async assemble(): Promise<ContextSnapshot> {
    const openTabs = this.getOpenTabs();
    const recentTelemetry = await this.getRecentTelemetry();

    return {
      openTabs,
      recentTelemetry,
      timestamp: Date.now(),
    };
  }

  private getOpenTabs(): TabContext[] {
    if (!this.window) return [];

    const activeTab = this.window.activeTab;
    return this.window.allTabs.map((tab) => ({
      id: tab.id,
      title: tab.title,
      url: tab.url,
      domain: extractDomain(tab.url),
      isActive: tab.id === activeTab?.id,
    }));
  }

  private async getRecentTelemetry(): Promise<TelemetryDocType[]> {
    return this.telemetryService.getRecentEvents(5 * 60 * 1000); // Last 5 mins
  }
}
