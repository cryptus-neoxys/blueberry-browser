import { describe, it, expect, beforeAll } from "vitest";
import { createDatabase } from "../database";
import { TelemetryService } from "./TelemetryService";

describe("TelemetryService", () => {
  beforeAll(async () => {
    await createDatabase();
  });

  it("records telemetry events", async () => {
    const service = new TelemetryService();

    const event = await service.recordEvent({
      tabId: "tab-1",
      url: "https://example.com",
      title: "Example",
      eventType: "navigation",
    });

    expect(event.id).toBeDefined();
    expect(event.tabId).toBe("tab-1");
    expect(event.eventType).toBe("navigation");
  });

  it("enforces an upper limit on stored events", async () => {
    const service = new TelemetryService();

    for (let i = 0; i < 2100; i += 1) {
      await service.recordEvent({
        tabId: `tab-${i}`,
        url: "https://example.com",
        title: "Example",
        eventType: "navigation",
      });
    }

    const { total } = await service.listEvents({ limit: 10 });
    expect(total).toBeLessThanOrEqual(2000);
  });
});
