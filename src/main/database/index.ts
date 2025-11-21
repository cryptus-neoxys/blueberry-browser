import { createRxDatabase, RxDatabase, RxCollection, addRxPlugin } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
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
    const db = await createRxDatabase<MyDatabaseCollections>({
      name: "blueberrydb",
      storage: getRxStorageDexie(),
    });

    await db.addCollections({
      memories: {
        schema: memorySchema,
      },
    });

    return db;
  })();

  return dbPromise;
};

export const getDatabase = (): Promise<MyDatabase> => {
  return createDatabase();
};
