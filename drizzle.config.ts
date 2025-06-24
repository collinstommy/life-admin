import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/305e3eb4-8b4d-4f2b-8719-c942196b1f04.sqlite",
  },
  breakpoints: true,
  verbose: true,
  strict: true,
});
