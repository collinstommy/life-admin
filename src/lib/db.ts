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
        date: healthData.date || new Date().toISOString().split('T')[0],
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
 * Get a specific health log by ID with properly structured related data
 * @param ctx Hono context with D1 binding
 * @param id ID of the health log to retrieve
 * @returns Health log with structured data or null if not found
 */
export async function getHealthLogById(ctx: AppContext, id: number) {
  const db = initDb(ctx);

  try {
    // Get the main health log
    const healthLog = await db.query.healthLogs.findFirst({
      where: eq(schema.healthLogs.id, id),
    });

    if (!healthLog) {
      return null;
    }

    try {
      // Fetch related data
      const [healthDataRecord] = await db.query.healthData.findMany({
        where: eq(schema.healthData.logId, id),
        limit: 1,
      });

      const workoutsData = await db.query.workouts.findMany({
        where: eq(schema.workouts.logId, id),
      });

      const mealsData = await db.query.meals.findMany({
        where: eq(schema.meals.logId, id),
      });

      const [painData] = await db.query.painDiscomfort.findMany({
        where: eq(schema.painDiscomfort.logId, id),
        limit: 1,
      });

      // Build the structured health data object that the frontend expects
      const structuredHealthData = {
        date: healthLog.date,
        screenTimeHours: healthDataRecord?.screenTimeHours || null,
        waterIntakeLiters: healthDataRecord?.waterIntakeLiters || null,
        energyLevel: healthDataRecord?.energyLevel || null,
        weightKg: healthDataRecord?.weightKg || null,
        otherActivities: healthDataRecord?.otherActivities || null,
        notes: healthDataRecord?.generalNotes || null,
        sleep: healthDataRecord?.sleepHours || healthDataRecord?.sleepQuality
          ? {
              hours: healthDataRecord.sleepHours,
              quality: healthDataRecord.sleepQuality,
            }
          : null,
        mood: healthDataRecord?.moodRating || healthDataRecord?.moodNotes
          ? {
              rating: healthDataRecord.moodRating,
              notes: healthDataRecord.moodNotes,
            }
          : null,
        workouts: workoutsData.map((workout) => ({
          type: workout.type,
          durationMinutes: workout.durationMinutes,
          distanceKm: workout.distanceKm,
          intensity: workout.intensity,
          notes: workout.notes,
        })),
        meals: mealsData.map((meal) => ({
          type: meal.type,
          notes: meal.notes,
        })),
        painDiscomfort: painData
          ? {
              location: painData.location,
              intensity: painData.intensity,
              notes: painData.notes,
            }
          : null,
      };

      return {
        id: healthLog.id,
        date: healthLog.date,
        audioUrl: healthLog.audioUrl,
        transcript: healthLog.transcript,
        structuredData: structuredHealthData,
        createdAt: healthLog.createdAt,
        updatedAt: healthLog.updatedAt,
      };
    } catch (relationError) {
      console.error(`Error fetching related data for log ${id}:`, relationError);
      
      // Fallback to structured data JSON if relations fail
      let structuredData = null;
      if (healthLog.structuredData) {
        try {
          structuredData = JSON.parse(healthLog.structuredData);
        } catch (parseError) {
          console.error("Error parsing structured data JSON:", parseError);
        }
      }

      return {
        ...healthLog,
        structuredData,
      };
    }
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
 * Delete all health logs and related data
 * @param ctx Hono context with D1 binding
 * @returns number of health logs deleted
 */
export async function deleteAllHealthLogs(ctx: AppContext): Promise<number> {
  const db = initDb(ctx);

  try {
    const existingLogs = await db.query.healthLogs.findMany();
    const logCount = existingLogs.length;

    if (logCount === 0) {
      console.log("No health logs found to delete");
      return 0;
    }

    await db.delete(schema.workouts);
    await db.delete(schema.meals);
    await db.delete(schema.painDiscomfort);
    await db.delete(schema.healthData);
    await db.delete(schema.healthLogs);

    console.log(`Successfully deleted ${logCount} health logs and all related data`);
    return logCount;
  } catch (error) {
    console.error("Failed to delete all health logs:", error);
    throw new Error(`Failed to delete all health logs: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get all health logs with properly structured related data
 * @param ctx Hono context with D1 binding
 * @returns Array of health logs with related data
 */
export async function getAllHealthLogs(ctx: AppContext) {
  const db = initDb(ctx);

  try {
    // First get all health logs
    const healthLogs = await db.query.healthLogs.findMany({
      orderBy: (healthLogs, { desc }) => [desc(healthLogs.date)],
    });

    if (healthLogs.length === 0) {
      return [];
    }

    // For each health log, manually fetch related data to build the expected structure
    const logsWithData = await Promise.all(
      healthLogs.map(async (log) => {
        try {
          // Fetch related data
          const [healthDataRecord] = await db.query.healthData.findMany({
            where: eq(schema.healthData.logId, log.id),
            limit: 1,
          });

          const workoutsData = await db.query.workouts.findMany({
            where: eq(schema.workouts.logId, log.id),
          });

          const mealsData = await db.query.meals.findMany({
            where: eq(schema.meals.logId, log.id),
          });

          const [painData] = await db.query.painDiscomfort.findMany({
            where: eq(schema.painDiscomfort.logId, log.id),
            limit: 1,
          });

          // Build the structured health data object that the frontend expects
          const structuredHealthData = {
            date: log.date,
            screenTimeHours: healthDataRecord?.screenTimeHours || null,
            waterIntakeLiters: healthDataRecord?.waterIntakeLiters || null,
            energyLevel: healthDataRecord?.energyLevel || null,
            weightKg: healthDataRecord?.weightKg || null,
            otherActivities: healthDataRecord?.otherActivities || null,
            notes: healthDataRecord?.generalNotes || null,
            sleep: healthDataRecord?.sleepHours || healthDataRecord?.sleepQuality
              ? {
                  hours: healthDataRecord.sleepHours,
                  quality: healthDataRecord.sleepQuality,
                }
              : null,
            mood: healthDataRecord?.moodRating || healthDataRecord?.moodNotes
              ? {
                  rating: healthDataRecord.moodRating,
                  notes: healthDataRecord.moodNotes,
                }
              : null,
            workouts: workoutsData.map((workout) => ({
              type: workout.type,
              durationMinutes: workout.durationMinutes,
              distanceKm: workout.distanceKm,
              intensity: workout.intensity,
              notes: workout.notes,
            })),
            meals: mealsData.map((meal) => ({
              type: meal.type,
              notes: meal.notes,
            })),
            painDiscomfort: painData
              ? {
                  location: painData.location,
                  intensity: painData.intensity,
                  notes: painData.notes,
                }
              : null,
          };

          return {
            id: log.id,
            date: log.date,
            audioUrl: log.audioUrl,
            transcript: log.transcript,
            healthData: structuredHealthData,
            createdAt: log.createdAt,
            updatedAt: log.updatedAt,
          };
        } catch (relationError) {
          console.error(`Error fetching related data for log ${log.id}:`, relationError);
          
          // Fallback to structured data JSON if relations fail
          let structuredData = null;
          if (log.structuredData) {
            try {
              structuredData = JSON.parse(log.structuredData);
            } catch (parseError) {
              console.error("Error parsing structured data JSON:", parseError);
            }
          }

          return {
            id: log.id,
            date: log.date,
            audioUrl: log.audioUrl,
            transcript: log.transcript,
            healthData: structuredData || {},
            createdAt: log.createdAt,
            updatedAt: log.updatedAt,
          };
        }
      })
    );

    return logsWithData;
  } catch (error) {
    console.error("Database query failed completely, falling back to raw SQL:", error);

    // Final fallback to raw SQL
    try {
      const tableExists = await ctx.env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='health_logs'",
      ).all();

      if (tableExists.results.length === 0) {
        console.log("health_logs table doesn't exist yet, returning empty array");
        return [];
      }

      const rawResults = await ctx.env.DB.prepare(
        "SELECT * FROM health_logs ORDER BY date DESC",
      ).all<RawHealthLogRow>();

      if (!rawResults.results || rawResults.results.length === 0) {
        return [];
      }

      return rawResults.results.map((row: RawHealthLogRow) => {
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
          healthData: structuredData || {},
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });
    } catch (fallbackError) {
      console.error("Fallback SQL query also failed:", fallbackError);
      return [];
    }
  }
}

/**
 * Updates an existing health log with new data using complete replacement strategy
 * @param ctx Hono context with D1 binding
 * @param id ID of the health log to update
 * @param healthData Updated structured health data
 * @param originalTranscript Original transcript from the entry
 * @param updateTranscript New transcript from the voice update
 * @returns ID of the updated health log
 */
export async function updateHealthLog(
  ctx: AppContext,
  id: number,
  healthData: StructuredHealthData,
  originalTranscript: string,
  updateTranscript: string,
): Promise<number> {
  const db = initDb(ctx);
  const now = Math.floor(Date.now() / 1000);

  // Create merged transcript summary
  const mergedTranscript = `Original: ${originalTranscript}\nUpdated with: ${updateTranscript}`;

  try {
    console.log(`Starting update for health log ID: ${id}`);

    // 1. Update the main health log with new JSON and merged transcript
    await db
      .update(schema.healthLogs)
      .set({
        structuredData: JSON.stringify(healthData),
        transcript: mergedTranscript,
        updatedAt: now,
      })
      .where(eq(schema.healthLogs.id, id));

    console.log(`Updated main health log entry for ID: ${id}`);

    // 2. Delete all existing related data for this log (if they exist)
    try {
      await db.delete(schema.workouts).where(eq(schema.workouts.logId, id));
      console.log(`Deleted existing workouts for log ID: ${id}`);
    } catch (deleteError) {
      console.log(`No workouts to delete for log ID: ${id}`, deleteError);
    }

    try {
      await db.delete(schema.meals).where(eq(schema.meals.logId, id));
      console.log(`Deleted existing meals for log ID: ${id}`);
    } catch (deleteError) {
      console.log(`No meals to delete for log ID: ${id}`, deleteError);
    }

    try {
      await db.delete(schema.painDiscomfort).where(eq(schema.painDiscomfort.logId, id));
      console.log(`Deleted existing pain/discomfort for log ID: ${id}`);
    } catch (deleteError) {
      console.log(`No pain/discomfort to delete for log ID: ${id}`, deleteError);
    }

    try {
      await db.delete(schema.healthData).where(eq(schema.healthData.logId, id));
      console.log(`Deleted existing health data for log ID: ${id}`);
    } catch (deleteError) {
      console.log(`No health data to delete for log ID: ${id}`, deleteError);
    }

    // 3. Insert new healthData record
    await db.insert(schema.healthData).values({
      logId: id,
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

    console.log(`Inserted new health data for log ID: ${id}`);

    // 4. Insert new workouts if any
    if (healthData.workouts && healthData.workouts.length > 0) {
      for (const workout of healthData.workouts) {
        await db.insert(schema.workouts).values({
          logId: id,
          type: workout.type,
          durationMinutes: workout.durationMinutes,
          distanceKm: workout.distanceKm || null,
          intensity: workout.intensity,
          notes: workout.notes || null,
          createdAt: now,
          updatedAt: now,
        });
      }
      console.log(`Inserted ${healthData.workouts.length} workouts for log ID: ${id}`);
    }

    // 5. Insert new meals if any
    if (healthData.meals && healthData.meals.length > 0) {
      for (const meal of healthData.meals) {
        await db.insert(schema.meals).values({
          logId: id,
          type: meal.type,
          notes: meal.notes,
          createdAt: now,
          updatedAt: now,
        });
      }
      console.log(`Inserted ${healthData.meals.length} meals for log ID: ${id}`);
    }

    // 6. Insert new pain/discomfort if any
    if (healthData.painDiscomfort && 
        (healthData.painDiscomfort.location || 
         healthData.painDiscomfort.intensity || 
         healthData.painDiscomfort.notes)) {
      await db.insert(schema.painDiscomfort).values({
        logId: id,
        location: healthData.painDiscomfort.location,
        intensity: healthData.painDiscomfort.intensity,
        notes: healthData.painDiscomfort.notes || null,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Inserted pain/discomfort data for log ID: ${id}`);
    }

    console.log(`Health log updated successfully, ID: ${id}`);
    return id;

  } catch (error) {
    console.error("Failed to update health log:", error);
    throw new Error(
      `Failed to update health log: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
