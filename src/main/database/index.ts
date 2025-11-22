import {
  createRxDatabase,
  RxDatabase,
  RxCollection,
  addRxPlugin,
  RxStorage,
} from "rxdb";
import { getRxStorageMemory } from "rxdb/plugins/storage-memory";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { memorySchema, MemoryDocType } from "./schema";

// Add dev-mode plugin for development
if (process.env.NODE_ENV === "development") {
  addRxPlugin(RxDBDevModePlugin);
}

export type MemoryCollection = RxCollection<MemoryDocType>;

export type MyDatabaseCollections = {
  memories: MemoryCollection;
};

export type MyDatabase = RxDatabase<MyDatabaseCollections>;

let dbPromise: Promise<MyDatabase> | null = null;

export const createDatabase = async (): Promise<MyDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    let storage: RxStorage<any, any> = getRxStorageMemory();

    if (process.env.NODE_ENV === "development") {
      storage = wrappedValidateAjvStorage({
        storage,
      });
    }

    const db = await createRxDatabase<MyDatabaseCollections>({
      name: "blueberrydb",
      storage,
    });

    await db.addCollections({
      memories: {
        schema: memorySchema,
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
