// src/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db"; // Your Drizzle instance
import * as schema from "../db/schema"; // Your Drizzle schema

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // Supabase is Postgres
        schema: schema,
    }),
    emailAndPassword: {
        enabled: true
    },
    // Required for the client to communicate
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [
        process.env.FRONTEND_URL || "http://localhost:5173" // Vite default port
    ],
});
