import { Layout } from "./shared/Layout";
import { serveStatic } from "hono/cloudflare-workers";
// @ts-expect-error - cloudflare
import manifest from "__STATIC_CONTENT_MANIFEST";
import { app } from "./app";
import { NotionApiClient } from "./api/notion";
import type { MiddlewareHandler } from "hono";
import { HonoApp } from "./types";

// Middleware to verify API key
const authenticateApiKey: MiddlewareHandler<HonoApp> = async (c, next) => {
  const apiKey = c.req.header("X-API-Key");
  console.log(apiKey);
  if (!apiKey || apiKey !== c.env.DAILY_LOG_API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};

app.use("/*", async (c, next) => {
  if (c.req.path.startsWith("/static/")) {
    return next();
  }
  return authenticateApiKey(c, next);
});

app.get("/static/*", serveStatic({ root: "./", manifest }));

app.get("/logs", async (c) => {
  const notionClient = new NotionApiClient(
    c.env.NOTION_TOKEN,
    c.env.NOTION_DATABASE_ID,
    c.env.DAILY_LOG_CACHE,
  );

  try {
    const logs = await notionClient.getAllLogs();
    return c.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return c.json({ error: "Failed to fetch logs" }, 500);
  }
});

app.get("/", (c) => {
  return c.html(
    <Layout>
      <div>
        <h1 class="text-2xl font-bold">Hello World</h1>
        <a class="link link-accent">I'm a simple link</a>
      </div>
    </Layout>,
  );
});

export default app;
