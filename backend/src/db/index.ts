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

// Lazy initialization to avoid crashing when DATABASE_URL is not set
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
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

// Export a proxy that lazily initializes the db
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const realDb = getDb();
    const value = realDb[prop as keyof typeof realDb];
    if (typeof value === "function") {
      return value.bind(realDb);
    }
    return value;
  },
});
