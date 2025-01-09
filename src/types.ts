import { DrizzleD1Database } from "drizzle-orm/d1";
import { Context } from "hono";
import * as schema from "./db/schema";

// secrets
type Bindings = {
  NOTION_TOKEN: string;
  NOTION_DATABASE_ID: string;
};

export type HonoApp = {
  Bindings: Bindings;
  Variables: {
    db: AppDB;
  };
};

export type AppContext<T extends string = ""> = Context<HonoApp, T>;

export type AppDB = DrizzleD1Database<typeof schema>;
