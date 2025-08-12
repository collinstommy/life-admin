import { DrizzleD1Database } from "drizzle-orm/d1";
import { Context } from "hono";
import * as schema from "./db/schema";

// secrets
type Bindings = {
  NOTION_TOKEN: string;
  NOTION_DATABASE_ID: string;
  DAILY_LOG_CACHE: KVNamespace;
  DAILY_LOG_API_KEY: string;
  LOGS_API_KEY: string;
  // New bindings for health tracker
  HEALTH_RECORDINGS: R2Bucket;
  AI: unknown; // For Cloudflare AI (Whisper, etc.)
  DB: D1Database; // For Cloudflare D1
  // Gemini API
  GEMINI_API_KEY: string;
  PASSWORD: string;
  JWT_SECRET: string;
};

export type HonoApp = {
  Bindings: Bindings;
  Variables: {
    db: AppDB;
  };
};

export type AppContext<T extends string = ""> = Context<HonoApp, T>;

export type AppDB = DrizzleD1Database<typeof schema>;
