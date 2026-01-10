import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

// Lazy imports to avoid circular dependency issues at module load time
let visualSearchRoutes: Elysia | null = null;
let auth: { handler: (req: Request) => Promise<Response> } | null = null;
let appRouter: unknown = null;
let createContext: (opts: { context: unknown }) => unknown = () => ({});
let db: unknown = null;

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
  .onError(({ error, set }) => {
    console.error("[Server Error]", error);
    set.status = 500;
    return {
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  })
  .get("/", () => "OK")
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }));

// Dynamically load and register routes after app is created
async function initializeRoutes() {
  try {
    // Import modules dynamically to avoid circular deps
    const [vsModule, authModule, routersModule, contextModule, dbModule] = await Promise.all([
      import("./visual-search/routes"),
      import("./auth"),
      import("./api/routers"),
      import("./api/context"),
      import("./db"),
    ]);

    visualSearchRoutes = vsModule.visualSearchRoutes;
    auth = authModule.auth;
    appRouter = routersModule.appRouter;
    createContext = contextModule.createContext;
    db = dbModule.db;

    // Register visual search routes
    if (visualSearchRoutes) {
      app.use(visualSearchRoutes);
    }

    // Register auth routes
    app.all("/api/auth/*", async (context) => {
      if (!auth) {
        return { error: "Auth not initialized" };
      }
      return auth.handler(context.request);
    });

    // Register tRPC routes
    app.all("/trpc/*", async (context) => {
      if (!appRouter) {
        return { error: "tRPC not initialized" };
      }
      const { fetchRequestHandler } = await import("@trpc/server/adapters/fetch");
      const res = await fetchRequestHandler({
        endpoint: "/trpc",
        router: appRouter as Parameters<typeof fetchRequestHandler>[0]["router"],
        req: context.request,
        createContext: () => createContext({ context }),
      });
      return res;
    });

    // Decorate with db
    if (db) {
      app.decorate("db", db);
    }

    console.log("[Server] Routes initialized successfully");
  } catch (error) {
    console.error("[Server] Failed to initialize routes:", error);
  }
}

// Initialize routes (non-blocking)
initializeRoutes();

// For Vercel serverless - export the app's fetch handler
export default app;

// For local development with bun run
if (typeof Bun !== "undefined" && !process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log(`Server running at http://localhost:${port}`);
}
