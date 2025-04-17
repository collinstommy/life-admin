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

  // Begin transaction
  return await db.transaction(async (tx) => {
    // Insert the health log
    const [healthLogResult] = await tx
      .insert(schema.healthLogs)
      .values({
        date: healthData.date,
        audioUrl,
        transcript,
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
      generalNotes: healthData.generalNotes,
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
        notes: healthData.painDiscomfort.notes,
        createdAt: now,
        updatedAt: now,
      });
    }

    return logId;
  });
}

/**
 * Gets a health log by ID including all related data
 * @param ctx Hono context with D1 binding
 * @param id ID of the health log
 * @returns Health log with all related data
 */
export async function getHealthLogById(ctx: AppContext, id: number) {
  const db = initDb(ctx);

  // Get the health log
  const healthLog = await db.query.healthLogs.findFirst({
    where: eq(schema.healthLogs.id, id),
  });

  if (!healthLog) {
    return null;
  }

  // Get the health data
  const healthData = await db.query.healthData.findFirst({
    where: eq(schema.healthData.logId, id),
  });

  // Get the workouts
  const workouts = await db.query.workouts.findMany({
    where: eq(schema.workouts.logId, id),
  });

  // Get the meals
  const meals = await db.query.meals.findMany({
    where: eq(schema.meals.logId, id),
  });

  // Get the pain/discomfort
  const painDiscomfort = await db.query.painDiscomfort.findFirst({
    where: eq(schema.painDiscomfort.logId, id),
  });

  return {
    ...healthLog,
    healthData,
    workouts,
    meals,
    painDiscomfort,
  };
}

/**
 * Gets all health logs with their related data
 * @param ctx Hono context with D1 binding
 * @returns Array of health logs with related data
 */
export async function getAllHealthLogs(ctx: AppContext) {
  const db = initDb(ctx);

  // Get all health logs
  const healthLogs = await db.query.healthLogs.findMany({
    orderBy: (healthLogs, { desc }) => [desc(healthLogs.date)],
  });

  // For each health log, get the related data
  const result = await Promise.all(
    healthLogs.map(async (log) => {
      return await getHealthLogById(ctx, log.id);
    }),
  );

  return result.filter(Boolean); // Remove any nulls from the result
}
