import { cors } from "@elysiajs/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Elysia } from "elysia";
import { createContext } from "./api/context";
import { appRouter } from "./api/routers";
import { auth } from "./auth";
import { visualSearchRoutes } from "./visual-search/routes";

const app = new Elysia()
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
  .get("/", () => "OK")
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }));

export default app;
