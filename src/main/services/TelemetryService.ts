import { randomUUID } from "crypto";
import { getDatabase, MyDatabase } from "../database";
import { TelemetryDocType } from "../database/schema";

export interface TelemetryEventInput {
  tabId: string;
  url: string;
  title: string;
  eventType: string;
  metadata?: Record<string, unknown>;
  lastActiveAt?: number;
}

export interface TelemetryListOptions {
  limit?: number;
  offset?: number;
  eventType?: string;
}

export interface TelemetryListResult {
  entries: TelemetryDocType[];
  total: number;
  hasMore: boolean;
}

const DEFAULT_LIMIT = 100;
const MAX_RETENTION = 2000;

export interface TelemetryServiceOptions {
  maxRetention?: number;
}

export class TelemetryService {
  private dbPromise: Promise<MyDatabase>;
  private maxRetention: number;

  constructor(options: TelemetryServiceOptions = {}) {
    this.dbPromise = getDatabase();
    this.maxRetention = options.maxRetention ?? MAX_RETENTION;
  }

  async recordEvent(event: TelemetryEventInput): Promise<TelemetryDocType> {
    const db = await this.dbPromise;
    const createdAt = Date.now();
    const doc = await db.telemetry.insert({
      id: randomUUID(),
      tabId: event.tabId,
      title: event.title,
      url: event.url,
      eventType: event.eventType,
      metadata: event.metadata ?? {},
      createdAt,
      lastActiveAt: event.lastActiveAt ?? createdAt,
    });

    await this.enforceRetention();
    return doc.toJSON() as TelemetryDocType;
  }

  async listEvents(
    options: TelemetryListOptions = {}
  ): Promise<TelemetryListResult> {
    const db = await this.dbPromise;
    const limit = options.limit ?? DEFAULT_LIMIT;
    const offset = options.offset ?? 0;

    const selector: Record<string, unknown> = {};
    if (options.eventType) {
      selector.eventType = options.eventType;
    }

    const query = db.telemetry.find({
      selector,
      sort: [{ createdAt: "desc" }],
    });

    const docs = await query.exec();
    const total = docs.length;
    const entries = docs
      .slice(offset, offset + limit)
      .map((doc) => doc.toJSON() as TelemetryDocType);

    return {
      entries,
      total,
      hasMore: offset + limit < total,
    };
  }

  private async enforceRetention(): Promise<void> {
    const db = await this.dbPromise;
    const docs = await db.telemetry
      .find({
        sort: [{ createdAt: "asc" }],
      })
      .exec();

    const overLimit = docs.length - this.maxRetention;
    if (overLimit <= 0) {
      return;
    }

    const toRemove = docs.slice(0, overLimit);
    await Promise.all(toRemove.map((doc) => doc.remove()));
  }
}
