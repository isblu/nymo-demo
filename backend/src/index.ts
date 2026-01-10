import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => "OK")
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }));

export default app;
