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
    const [healthLogResult] = await db
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

    await db.insert(schema.healthData).values({
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

    if (healthData.workouts && healthData.workouts.length > 0) {
      for (const workout of healthData.workouts) {
        await db.insert(schema.workouts).values({
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
        await db.insert(schema.meals).values({
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
      await db.insert(schema.painDiscomfort).values({
        logId,
        location: healthData.painDiscomfort.location,
        intensity: healthData.painDiscomfort.intensity,
        notes: healthData.painDiscomfort.notes || null,
        createdAt: now,
        updatedAt: now,
      });
    }

    return logId;
  } catch (error) {
    console.error(
      "Database operations failed, falling back to raw SQL:",
      error,
    );

    // If ORM fails, try to at least save the main health log with raw SQL
    try {
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
 * Get a specific health log by ID
 * @param ctx Hono context with D1 binding
 * @param id ID of the health log to retrieve
 * @returns Health log or null if not found
 */
export async function getHealthLogById(ctx: AppContext, id: number) {
  const db = initDb(ctx);

  try {
    const healthLog = await db.query.healthLogs.findFirst({
      where: eq(schema.healthLogs.id, id),
      with: {
        healthData: true,
        workouts: true,
        meals: true,
        painDiscomfort: true,
      },
    });

    return healthLog || null;
  } catch (error) {
    console.error(`Failed to get health log with ID ${id}:`, error);
    throw new Error(`Failed to get health log: ${error instanceof Error ? error.message : String(error)}`);
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
 * Delete a health log and all related data by ID
 * @param ctx Hono context with D1 binding
 * @param id ID of the health log to delete
 * @returns boolean indicating success
 */
export async function deleteHealthLog(ctx: AppContext, id: number): Promise<boolean> {
  const db = initDb(ctx);

  try {
    // First check if the health log exists
    const existingLog = await db.query.healthLogs.findFirst({
      where: eq(schema.healthLogs.id, id),
    });

    if (!existingLog) {
      console.log(`Health log with ID ${id} not found`);
      return false;
    }

    // Delete related data first (order matters due to foreign key constraints)
    await db.delete(schema.workouts).where(eq(schema.workouts.logId, id));
    await db.delete(schema.meals).where(eq(schema.meals.logId, id));
    await db.delete(schema.painDiscomfort).where(eq(schema.painDiscomfort.logId, id));
    await db.delete(schema.healthData).where(eq(schema.healthData.logId, id));
    
    // Finally delete the main health log
    const result = await db.delete(schema.healthLogs).where(eq(schema.healthLogs.id, id));

    console.log(`Successfully deleted health log with ID: ${id}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete health log with ID ${id}:`, error);
    throw new Error(`Failed to delete health log: ${error instanceof Error ? error.message : String(error)}`);
  }
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
