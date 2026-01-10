import { createContext } from "./api/context";
import { appRouter } from "./api/routers";
import { cors } from "@elysiajs/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Elysia } from "elysia";
import { auth } from "./auth";
import { db } from "./db";
import { visualSearchRoutes } from "./visual-search/routes";

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
  .onError(({ error, set }) => {
    console.error("[Server Error]", error);
    set.status = 500;
    return {
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  })
  .use(visualSearchRoutes)
  // Better Auth routes
  .all("/api/auth/*", async (context) => auth.handler(context.request))
  .all("/trpc/*", async (context) => {
    const res = await fetchRequestHandler({
      endpoint: "/trpc",
      router: appRouter,
      req: context.request,
      createContext: () => createContext({ context }),
    });
    return res;
  })
  .get("/", () => "OK");

// For Vercel serverless - export the app's fetch handler
export default app;

// For local development with bun run
if (typeof Bun !== "undefined" && !process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log(`Server running at http://localhost:${port}`);
}
