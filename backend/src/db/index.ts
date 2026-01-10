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

const queryClient = postgres(process.env.DATABASE_URL ?? "");
export const db = drizzle(queryClient, {
  schema: {
    users,
    posts,
    user,
    session,
    account,
    verification,
    userRelations,
    sessionRelations,
    accountRelations,
  },
});
