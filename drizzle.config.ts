import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "d1",
  // dbCredentials: {
  //   url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/d5f8fb30bfe22d7146763158fc29bdfab52d77fa6a7be952a019fde33d8be3e3.sqlite",
  // },
} satisfies Config;
