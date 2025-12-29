import { createContext } from "@Nymo/api/context";
import { appRouter } from "@Nymo/api/routers/index";
import { cors } from "@elysiajs/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Elysia } from "elysia";
import { visualSearchRoutes } from "./visual-search/routes";

const PORT = Number(process.env.PORT) || 3000;

function main() {
  console.log(`[Server] Starting on port ${PORT}...`);
  console.log("[Server] Using Modal.com for embeddings");

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
    .listen(PORT);

  console.log(`[Server] Server is running on http://0.0.0.0:${PORT}`);

  return app;
}

main().catch((error) => {
  console.error("[Server] Fatal error:", error);
  process.exit(1);
});
