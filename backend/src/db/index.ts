// src/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  account,
  accountRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from "./auth-schema";
import { posts, users } from "./schema";

const schema = {
  users,
  posts,
  user,
  session,
  account,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
};

// Lazy initialization - only connect when actually used
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const queryClient = postgres(databaseUrl);
    _db = drizzle(queryClient, { schema });
  }
  return _db;
}

// For backwards compatibility - but prefer using getDb() for lazy initialization
// This will throw at runtime if DATABASE_URL is not set when first accessed
export const db = {
  get query() {
    return getDb().query;
  },
  get select() {
    return getDb().select.bind(getDb());
  },
  get insert() {
    return getDb().insert.bind(getDb());
  },
  get update() {
    return getDb().update.bind(getDb());
  },
  get delete() {
    return getDb().delete.bind(getDb());
  },
  get execute() {
    return getDb().execute.bind(getDb());
  },
};
