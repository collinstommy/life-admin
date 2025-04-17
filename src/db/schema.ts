import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Main table to store health logs
export const healthLogs = sqliteTable("health_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(), // YYYY-MM-DD format
  audioUrl: text("audio_url").notNull(), // R2 URL to audio file
  transcript: text("transcript"), // Raw transcript from Whisper
  createdAt: integer("created_at").notNull(), // Unix timestamp
  updatedAt: integer("updated_at").notNull(), // Unix timestamp
});

// Table for structured health data
export const healthData = sqliteTable("health_data", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logId: integer("log_id")
    .notNull()
    .references(() => healthLogs.id), // Foreign key to health_logs
  screenTimeHours: real("screen_time_hours"),
  waterIntakeLiters: real("water_intake_liters"),
  sleepHours: real("sleep_hours"),
  sleepQuality: integer("sleep_quality"), // 1-10 rating
  energyLevel: integer("energy_level"), // 1-10 rating
  moodRating: integer("mood_rating"), // 1-10 rating
  moodNotes: text("mood_notes"),
  weightKg: real("weight_kg"),
  otherActivities: text("other_activities"),
  generalNotes: text("general_notes"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Table for workout data (multiple per health log)
export const workouts = sqliteTable("workouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logId: integer("log_id")
    .notNull()
    .references(() => healthLogs.id),
  type: text("type").notNull(),
  durationMinutes: integer("duration_minutes"),
  distanceKm: real("distance_km"),
  intensity: integer("intensity"), // 1-10 rating
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Table for meals (multiple per health log)
export const meals = sqliteTable("meals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logId: integer("log_id")
    .notNull()
    .references(() => healthLogs.id),
  type: text("type").notNull(), // Breakfast, Lunch, Dinner, Snacks, Coffee
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Table for pain/discomfort entries
export const painDiscomfort = sqliteTable("pain_discomfort", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logId: integer("log_id")
    .notNull()
    .references(() => healthLogs.id),
  location: text("location"),
  intensity: integer("intensity"), // 1-10 rating
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Exporting types for type safety
export type HealthLog = typeof healthLogs.$inferSelect;
export type HealthData = typeof healthData.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type Meal = typeof meals.$inferSelect;
export type PainDiscomfort = typeof painDiscomfort.$inferSelect;
