import "server-only";

import { pgSchema } from "drizzle-orm/pg-core";

/** Application-owned PostgreSQL namespace; business tables arrive in later Changes. */
export const appSchema = pgSchema("app");
