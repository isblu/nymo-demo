// import "dotenv/config";
import { createContext } from "@Nymo/api/context";
import { appRouter } from "@Nymo/api/routers/index";
import { cors } from "@elysiajs/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Elysia } from "elysia";
import { startPythonServer } from "./visual-search/pythonProcess";
import { visualSearchRoutes } from "./visual-search/routes";

(async () => {
  try {
    await startPythonServer();
    console.log("[Server] Python embedding server started");
  } catch (error) {
    console.error("[Server] Failed to start Python server:", error);
    console.log("[Server] Continuing without embedding support...");
  }

  const _app = new Elysia()
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
    .listen(Number(process.env.PORT) || 3000, () => {
      console.log(
        `Server is running on http://localhost:${Number(process.env.PORT) || 3000}`
      );
    });
})();
