import "server-only";

import type { NodePgTransaction } from "drizzle-orm/node-postgres";
import type { ExtractTablesWithRelations } from "drizzle-orm/relations";

import * as schema from "./schema";
import { getDb, type AppDatabase } from "./client";

export type DbTransaction = NodePgTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type TransactionCallback<T> = (tx: DbTransaction) => Promise<T>;

export function bindTransactionRunner(database: AppDatabase) {
  return function withBoundTransaction<T>(
    callback: TransactionCallback<T>,
  ): Promise<T> {
    return database.transaction((tx) => callback(tx));
  };
}

export function withTransaction<T>(
  callback: TransactionCallback<T>,
): Promise<T> {
  return getDb().transaction((tx) => callback(tx));
}
