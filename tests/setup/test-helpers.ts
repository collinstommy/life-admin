import { createTestDB } from './test-db'
import { Hono } from 'hono'
import * as schema from '../../src/db/schema'
import type { StructuredHealthData } from '../../src/lib/ai'

export interface TestHealthLogData {
  date: string
  audioUrl?: string
  transcript?: string
  healthData: StructuredHealthData
}

export interface TestContext {
  db: ReturnType<typeof createTestDB>['db']
  sqlite: ReturnType<typeof createTestDB>['sqlite']
  cleanup: () => void
}

/**
 * Set up a test context with SQLite database
 */
export function setupTestContext(): TestContext {
  const { db, sqlite, cleanup } = createTestDB()
  
  return {
    db,
    sqlite,
    cleanup
  }
}

/**
 * Create a test health log in the database
 */
export async function createTestHealthLog(
  db: ReturnType<typeof createTestDB>['db'],
  data: TestHealthLogData
): Promise<number> {
  const now = Date.now()
  
  // Insert main health log
  const logResult = await db.insert(schema.healthLogs).values({
    date: data.date,
    audioUrl: data.audioUrl || null,
    transcript: data.transcript || null,
    structuredData: JSON.stringify(data.healthData),
    createdAt: now,
    updatedAt: now
  }).returning({ id: schema.healthLogs.id })
  
  const logId = logResult[0].id
  
  // Insert related health data
  if (data.healthData) {
    await db.insert(schema.healthData).values({
      logId,
      screenTimeHours: data.healthData.screenTimeHours || null,
      waterIntakeLiters: data.healthData.waterIntakeLiters || null,
      sleepHours: data.healthData.sleep?.hours || null,
      sleepQuality: data.healthData.sleep?.quality || null,
      energyLevel: data.healthData.energyLevel || null,
      moodRating: data.healthData.mood?.rating || null,
      moodNotes: data.healthData.mood?.notes || null,
      weightKg: data.healthData.weightKg || null,
      otherActivities: data.healthData.otherActivities || null,
      generalNotes: data.healthData.notes || null,
      createdAt: now,
      updatedAt: now,
    })
    
    // Insert workouts if any
    if (data.healthData.workouts && data.healthData.workouts.length > 0) {
      for (const workout of data.healthData.workouts) {
        await db.insert(schema.workouts).values({
          logId,
          type: workout.type,
          durationMinutes: workout.durationMinutes,
          distanceKm: workout.distanceKm || null,
          intensity: workout.intensity,
          notes: workout.notes || null,
          createdAt: now,
          updatedAt: now,
        })
      }
    }
    
    // Insert meals if any
    if (data.healthData.meals && data.healthData.meals.length > 0) {
      for (const meal of data.healthData.meals) {
        await db.insert(schema.meals).values({
          logId,
          type: meal.type,
          notes: meal.notes,
          createdAt: now,
          updatedAt: now,
        })
      }
    }
    
    // Insert pain/discomfort if any
    if (data.healthData.painDiscomfort) {
      await db.insert(schema.painDiscomfort).values({
        logId,
        location: data.healthData.painDiscomfort.location,
        intensity: data.healthData.painDiscomfort.intensity,
        notes: data.healthData.painDiscomfort.notes || null,
        createdAt: now,
        updatedAt: now,
      })
    }
  }
  
  return logId
}

/**
 * Sample health data for testing
 */
export const sampleHealthData: StructuredHealthData = {
  date: '2024-01-01',
  screenTimeHours: 4,
  waterIntakeLiters: 2.5,
  energyLevel: 8,
  weightKg: null,
  otherActivities: null,
  notes: 'Feeling great today',
  sleep: {
    hours: 8,
    quality: 8
  },
  mood: {
    rating: 7,
    notes: 'positive mood'
  },
  workouts: [
    {
      type: 'running',
      durationMinutes: 30,
      distanceKm: 5,
      intensity: 8,
      notes: 'morning run'
    }
  ],
  meals: [
    {
      type: 'breakfast',
      notes: 'oatmeal with berries'
    }
  ],
  painDiscomfort: undefined
}

/**
 * Create sample test data with variations
 */
export function createSampleHealthData(overrides?: Partial<StructuredHealthData>): StructuredHealthData {
  return {
    ...sampleHealthData,
    ...overrides
  }
} 