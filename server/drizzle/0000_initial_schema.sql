-- Initial schema for health tracker database

-- Health logs table
CREATE TABLE IF NOT EXISTS "health_logs" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "date" TEXT NOT NULL,
  "audio_url" TEXT NOT NULL,
  "transcript" TEXT,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL
);

-- Health data table
CREATE TABLE IF NOT EXISTS "health_data" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "log_id" INTEGER NOT NULL,
  "screen_time_hours" REAL,
  "water_intake_liters" REAL,
  "sleep_hours" REAL,
  "sleep_quality" INTEGER,
  "energy_level" INTEGER,
  "mood_rating" INTEGER,
  "mood_notes" TEXT,
  "weight_kg" REAL,
  "other_activities" TEXT,
  "general_notes" TEXT,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL,
  FOREIGN KEY ("log_id") REFERENCES "health_logs" ("id")
);

-- Workouts table
CREATE TABLE IF NOT EXISTS "workouts" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "log_id" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "duration_minutes" INTEGER,
  "distance_km" REAL,
  "intensity" INTEGER,
  "notes" TEXT,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL,
  FOREIGN KEY ("log_id") REFERENCES "health_logs" ("id")
);

-- Meals table
CREATE TABLE IF NOT EXISTS "meals" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "log_id" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "notes" TEXT,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL,
  FOREIGN KEY ("log_id") REFERENCES "health_logs" ("id")
);

-- Pain/discomfort table
CREATE TABLE IF NOT EXISTS "pain_discomfort" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "log_id" INTEGER NOT NULL,
  "location" TEXT,
  "intensity" INTEGER,
  "notes" TEXT,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL,
  FOREIGN KEY ("log_id") REFERENCES "health_logs" ("id")
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS "health_logs_date_idx" ON "health_logs" ("date");
CREATE INDEX IF NOT EXISTS "health_data_log_id_idx" ON "health_data" ("log_id");
CREATE INDEX IF NOT EXISTS "workouts_log_id_idx" ON "workouts" ("log_id");
CREATE INDEX IF NOT EXISTS "meals_log_id_idx" ON "meals" ("log_id");
CREATE INDEX IF NOT EXISTS "pain_discomfort_log_id_idx" ON "pain_discomfort" ("log_id");
