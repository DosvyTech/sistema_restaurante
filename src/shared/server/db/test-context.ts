import "server-only";

import { createDatabaseContext } from "./client";
import { getTestDatabaseUrl } from "./config";
import { bindTransactionRunner } from "./transaction";

export function createTestDatabaseContext() {
  const context = createDatabaseContext(
    getTestDatabaseUrl(),
    "dosvy-chg003-test",
  );

  return {
    ...context,
    withTransaction: bindTransactionRunner(context.db),
  };
}
