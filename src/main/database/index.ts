import "fake-indexeddb/auto";

import { createRxDatabase, RxDatabase, RxCollection, addRxPlugin } from "rxdb";
import { getRxStorageDexie, RxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import {
  memorySchema,
  MemoryDocType,
  telemetrySchema,
  TelemetryDocType,
  suggestionSchema,
  SuggestionDocType,
} from "./schema";

// Add dev-mode plugin for development
if (process.env.NODE_ENV === "development") {
  addRxPlugin(RxDBDevModePlugin);
}

export type MemoryCollection = RxCollection<MemoryDocType>;

export type TelemetryCollection = RxCollection<TelemetryDocType>;

export type SuggestionCollection = RxCollection<SuggestionDocType>;

export type MyDatabaseCollections = {
  memories: MemoryCollection;
  telemetry: TelemetryCollection;
  suggestions: SuggestionCollection;
};

export type MyDatabase = RxDatabase<MyDatabaseCollections>;

let dbPromise: Promise<MyDatabase> | null = null;

export const createDatabase = async (): Promise<MyDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    let storage: RxStorageDexie = getRxStorageDexie();

    if (process.env.NODE_ENV === "development") {
      storage = wrappedValidateAjvStorage({
        storage,
      }) as RxStorageDexie;
    }

    const db = await createRxDatabase<MyDatabaseCollections>({
      name: "blueberrydb",
      storage,
    });

    await db.addCollections({
      memories: {
        schema: memorySchema,
      },
      telemetry: {
        schema: telemetrySchema,
      },
      suggestions: {
        schema: suggestionSchema,
      },
    });

    return db;
  })().catch((err) => {
    console.error("Failed to initialize database:", err);
    throw err;
  });

  return dbPromise;
};

export const getDatabase = (): Promise<MyDatabase> => {
  return createDatabase();
};
