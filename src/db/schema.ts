import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable("user", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email"),
});

export type User = typeof userTable.$inferSelect;
