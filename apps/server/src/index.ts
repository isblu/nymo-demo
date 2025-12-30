import { createContext } from "@Nymo/api/context";
import { appRouter } from "@Nymo/api/routers/index";
import { cors } from "@elysiajs/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Elysia } from "elysia";
import { visualSearchRoutes } from "./visual-search/routes";
import { db } from "./db";
import { users } from "./db/schema";
import { auth } from "./auth";

const PORT = Number(process.env.PORT) || 3000;

function main() {
  console.log(`[Server] Starting on port ${PORT}...`);
  console.log("[Server] Using Modal.com for embeddings");

  const app = new Elysia()
    .decorate("db", db)
    .use(
      cors({
        origin: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
        credentials: true,
        exposeHeaders: ["Set-Cookie"],
      })
    )
    .use(visualSearchRoutes)
    // Better Auth routes
    .all("/api/auth/*", async (context) => {
      return auth.handler(context.request);
    })
    .all("/trpc/*", async (context) => {
      const res = await fetchRequestHandler({
        endpoint: "/trpc",
        router: appRouter,
        req: context.request,
        createContext: () => createContext({ context }),
      });
      return res;
    })
    .get("/", () => "OK")
    // Test route to verify database connection
    .get("/users", async ({ db }) => {
      return await db.select().from(users);
    })
    .listen(PORT);

  console.log(`[Server] Server is running on http://0.0.0.0:${PORT}`);

  return app;
}

try {
  main();
} catch (error) {
  console.error("[Server] Fatal error:", error);
  process.exit(1);
}
