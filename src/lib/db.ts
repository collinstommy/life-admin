import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { AppContext } from "../types";
import { StructuredHealthData } from "./ai";
import * as schema from "../db/schema";

/**
 * Initializes the database connection
 * @param ctx Hono context with D1 binding
 * @returns DrizzleD1Database instance
 */
export function initDb(ctx: AppContext) {
  return drizzle(ctx.env.DB, { schema });
}

/**
 * Ensure the database tables exist
 * @param ctx Hono context with D1 binding
 */
export async function migrateDb(ctx: AppContext) {
  console.log("Running database migrations...");
  try {
    const db = ctx.env.DB;

    // First check if the tables exist to provide better diagnostics
    try {
      const tables = await db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all();
      console.log("Existing tables:", JSON.stringify(tables));
    } catch (checkError) {
      console.error("Error checking existing tables:", checkError);
    }

    // Create health_logs table
    try {
      console.log("Creating health_logs table if it doesn't exist...");

      // Use a simple string without template literals to avoid any potential syntax issues
      const createHealthLogsSQL =
        "CREATE TABLE IF NOT EXISTS health_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, audio_url TEXT, transcript TEXT, structured_data TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)";

      await db.exec(createHealthLogsSQL);
      console.log("Created health_logs table if it didn't exist");

      // Verify the table was created
      const healthLogsTable = await db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='health_logs'",
        )
        .all();
      console.log(
        "health_logs table exists:",
        healthLogsTable.results.length > 0,
      );
    } catch (tableError) {
      console.error("Error creating health_logs table:", tableError);
      throw tableError;
    }

    // Create health_data table
    try {
      console.log("Creating health_data table if it doesn't exist...");
      const createHealthDataSQL =
        "CREATE TABLE IF NOT EXISTS health_data (id INTEGER PRIMARY KEY AUTOINCREMENT, log_id INTEGER NOT NULL, screen_time_hours REAL, water_intake_liters REAL, sleep_hours REAL, sleep_quality INTEGER, energy_level INTEGER, mood_rating INTEGER, mood_notes TEXT, weight_kg REAL, other_activities TEXT, general_notes TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY(log_id) REFERENCES health_logs(id))";

      await db.exec(createHealthDataSQL);
      console.log("Created health_data table if it didn't exist");
    } catch (tableError) {
      console.error("Error creating health_data table:", tableError);
      // Continue with other migrations even if this fails
    }

    // Create workouts table
    try {
      console.log("Creating workouts table if it doesn't exist...");
      const createWorkoutsSQL =
        "CREATE TABLE IF NOT EXISTS workouts (id INTEGER PRIMARY KEY AUTOINCREMENT, log_id INTEGER NOT NULL, type TEXT NOT NULL, duration_minutes INTEGER, distance_km REAL, intensity INTEGER, notes TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY(log_id) REFERENCES health_logs(id))";

      await db.exec(createWorkoutsSQL);
      console.log("Created workouts table if it didn't exist");
    } catch (tableError) {
      console.error("Error creating workouts table:", tableError);
      // Continue with other migrations even if this fails
    }

    // Create meals table
    try {
      console.log("Creating meals table if it doesn't exist...");
      const createMealsSQL =
        "CREATE TABLE IF NOT EXISTS meals (id INTEGER PRIMARY KEY AUTOINCREMENT, log_id INTEGER NOT NULL, type TEXT NOT NULL, notes TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY(log_id) REFERENCES health_logs(id))";

      await db.exec(createMealsSQL);
      console.log("Created meals table if it didn't exist");
    } catch (tableError) {
      console.error("Error creating meals table:", tableError);
      // Continue with other migrations even if this fails
    }

    // Create pain_discomfort table
    try {
      console.log("Creating pain_discomfort table if it doesn't exist...");
      const createPainDiscomfortSQL =
        "CREATE TABLE IF NOT EXISTS pain_discomfort (id INTEGER PRIMARY KEY AUTOINCREMENT, log_id INTEGER NOT NULL, location TEXT, intensity INTEGER, notes TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY(log_id) REFERENCES health_logs(id))";

      await db.exec(createPainDiscomfortSQL);
      console.log("Created pain_discomfort table if it didn't exist");
    } catch (tableError) {
      console.error("Error creating pain_discomfort table:", tableError);
      // Continue with other migrations even if this fails
    }

    // Final check to verify all tables exist
    try {
      const finalTables = await db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all();
      console.log("All tables after migration:", JSON.stringify(finalTables));
    } catch (checkError) {
      console.error("Error checking final tables:", checkError);
    }

    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Error during database migrations:", error);
    throw error;
  }
}

/**
 * Saves a health log and its structured data to the database
 * @param ctx Hono context with D1 binding
 * @param audioUrl URL to the audio file in R2
 * @param transcript Raw transcript from Whisper
 * @param healthData Structured health data from Gemini
 * @returns ID of the created health log
 */
export async function saveHealthLog(
  ctx: AppContext,
  audioUrl: string,
  transcript: string,
  healthData: StructuredHealthData,
): Promise<number> {
  const db = initDb(ctx);
  const now = Math.floor(Date.now() / 1000);

  try {
    // Try using the ORM first with a transaction
    return await db.transaction(async (tx) => {
      // Insert the health log with structured data as JSON
      const [healthLogResult] = await tx
        .insert(schema.healthLogs)
        .values({
          date: healthData.date,
          audioUrl,
          transcript,
          structuredData: JSON.stringify(healthData), // Store the complete structured data
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: schema.healthLogs.id });

      const logId = healthLogResult.id;

      // Insert the health data
      await tx.insert(schema.healthData).values({
        logId,
        screenTimeHours: healthData.screenTimeHours,
        waterIntakeLiters: healthData.waterIntakeLiters,
        sleepHours: healthData.sleep?.hours || null,
        sleepQuality: healthData.sleep?.quality || null,
        energyLevel: healthData.energyLevel,
        moodRating: healthData.mood?.rating || null,
        moodNotes: healthData.mood?.notes || null,
        weightKg: healthData.weightKg,
        otherActivities: healthData.otherActivities,
        generalNotes: healthData.notes,
        createdAt: now,
        updatedAt: now,
      });

      // Insert workouts if any
      if (healthData.workouts && healthData.workouts.length > 0) {
        for (const workout of healthData.workouts) {
          await tx.insert(schema.workouts).values({
            logId,
            type: workout.type,
            durationMinutes: workout.durationMinutes,
            distanceKm: workout.distanceKm || null,
            intensity: workout.intensity,
            notes: workout.notes || null,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // Insert meals if any
      if (healthData.meals && healthData.meals.length > 0) {
        for (const meal of healthData.meals) {
          await tx.insert(schema.meals).values({
            logId,
            type: meal.type,
            notes: meal.notes,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // Insert pain/discomfort if any
      if (healthData.painDiscomfort) {
        await tx.insert(schema.painDiscomfort).values({
          logId,
          location: healthData.painDiscomfort.location,
          intensity: healthData.painDiscomfort.intensity,
          notes: healthData.painDiscomfort.notes || null,
          createdAt: now,
          updatedAt: now,
        });
      }

      return logId;
    });
  } catch (error) {
    console.error("ORM transaction failed, falling back to raw SQL:", error);

    // If ORM fails, try to at least save the main health log with raw SQL
    try {
      // Try running migrations first to ensure tables exist
      try {
        await migrateDb(ctx);
      } catch (migrationError) {
        console.error("Migration failed during fallback save:", migrationError);
        // Continue anyway and try to insert
      }

      // Convert health data to JSON string for storage
      const structuredDataJson = JSON.stringify(healthData);

      // Insert just the main health log
      const result = await ctx.env.DB.prepare(
        "INSERT INTO health_logs (date, audio_url, transcript, structured_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
      )
        .bind(
          healthData.date,
          audioUrl,
          transcript,
          structuredDataJson,
          now,
          now,
        )
        .first<{ id: number }>();

      if (!result || !result.id) {
        throw new Error("Failed to insert health log");
      }

      const logId = result.id;
      console.log(`Health log saved with fallback method, ID: ${logId}`);

      return logId;
    } catch (fallbackError) {
      console.error("Fallback SQL save also failed:", fallbackError);
      throw new Error(
        `Failed to save health log: ${
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError)
        }`,
      );
    }
  }
}

/**
 * Get a specific health log by ID with fallback to raw SQL if ORM fails
 * @param ctx Hono context with D1 binding
 * @param id ID of the health log to retrieve
 * @returns Health log or null if not found
 */
export async function getHealthLogById(ctx: AppContext, id: number) {
  const db = initDb(ctx);

  try {
    // Try using the ORM first
    const healthLog = await db.query.healthLogs.findFirst({
      where: eq(schema.healthLogs.id, id),
      with: {
        healthData: true,
        workouts: true,
        meals: true,
        painDiscomfort: true,
      },
    });

    return healthLog;
  } catch (error) {
    console.error(
      `ORM query failed for ID ${id}, falling back to raw SQL:`,
      error,
    );

    // If ORM fails, fallback to a simple SQL query as a last resort
    try {
      // Check if the health_logs table exists before attempting to query it
      const tableExists = await ctx.env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='health_logs'",
      ).all();

      if (tableExists.results.length === 0) {
        console.log("health_logs table doesn't exist yet, returning null");
        return null;
      }

      // Perform a simple query to fetch just the health log
      const rawResult = await ctx.env.DB.prepare(
        "SELECT * FROM health_logs WHERE id = ?",
      )
        .bind(id)
        .first<RawHealthLogRow>();

      if (!rawResult) {
        return null;
      }

      // Parse the structured data JSON if it exists
      let structuredData = null;
      if (rawResult.structured_data) {
        try {
          structuredData = JSON.parse(rawResult.structured_data);
        } catch (parseError) {
          console.error("Error parsing structured data JSON:", parseError);
        }
      }

      // Map the row to our expected structure
      return {
        id: rawResult.id,
        date: rawResult.date,
        audioUrl: rawResult.audio_url,
        transcript: rawResult.transcript,
        structuredData,
        createdAt: rawResult.created_at,
        updatedAt: rawResult.updated_at,
        // If we have structured data, use it instead of providing empty values
        healthData: structuredData ? structuredData.healthData : null,
        workouts:
          structuredData && structuredData.workouts
            ? structuredData.workouts
            : [],
        meals:
          structuredData && structuredData.meals ? structuredData.meals : [],
        painDiscomfort: structuredData ? structuredData.painDiscomfort : null,
      };
    } catch (fallbackError) {
      console.error(
        `Fallback SQL query also failed for ID ${id}:`,
        fallbackError,
      );
      // If even the fallback fails, return null
      return null;
    }
  }
}

// Define an interface for the raw health log row
interface RawHealthLogRow {
  id: number;
  date: string;
  audio_url: string | null;
  transcript: string | null;
  structured_data: string | null;
  created_at: number;
  updated_at: number;
}

/**
 * Get all health logs with a fallback to raw SQL if ORM fails
 * @param ctx Hono context with D1 binding
 * @returns Array of health logs
 */
export async function getAllHealthLogs(ctx: AppContext) {
  const db = initDb(ctx);

  try {
    // Try using the ORM first
    return await db.query.healthLogs.findMany({
      with: {
        healthData: true,
        workouts: true,
        meals: true,
        painDiscomfort: true,
      },
      orderBy: (healthLogs, { desc }) => [desc(healthLogs.date)],
    });
  } catch (error) {
    console.error("ORM query failed, falling back to raw SQL:", error);

    // If ORM fails, fallback to a simple SQL query as a last resort
    try {
      // Check if the health_logs table exists before attempting to query it
      const tableExists = await ctx.env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='health_logs'",
      ).all();

      if (tableExists.results.length === 0) {
        console.log(
          "health_logs table doesn't exist yet, returning empty array",
        );
        return [];
      }

      // Perform a simple query to fetch just the health logs
      const rawResults = await ctx.env.DB.prepare(
        "SELECT * FROM health_logs ORDER BY date DESC",
      ).all<RawHealthLogRow>();

      if (!rawResults.results || rawResults.results.length === 0) {
        return [];
      }

      // Map the rows to our expected structure
      return rawResults.results.map((row: RawHealthLogRow) => {
        // Parse the structured data JSON if it exists
        let structuredData = null;
        if (row.structured_data) {
          try {
            structuredData = JSON.parse(row.structured_data);
          } catch (parseError) {
            console.error("Error parsing structured data JSON:", parseError);
          }
        }

        return {
          id: row.id,
          date: row.date,
          audioUrl: row.audio_url,
          transcript: row.transcript,
          structuredData,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          // If we have structured data, use it instead of providing empty values
          healthData: structuredData ? structuredData.healthData : null,
          workouts:
            structuredData && structuredData.workouts
              ? structuredData.workouts
              : [],
          meals:
            structuredData && structuredData.meals ? structuredData.meals : [],
          painDiscomfort: structuredData ? structuredData.painDiscomfort : null,
        };
      });
    } catch (fallbackError) {
      console.error("Fallback SQL query also failed:", fallbackError);
      // If even the fallback fails, return an empty array
      return [];
    }
  }
}
