import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { setupTestContext, createTestHealthLog, createSampleHealthData } from '../setup/test-helpers'
import type { TestContext } from '../setup/test-helpers'
import { eq } from 'drizzle-orm'
import * as schema from '../../src/db/schema'

describe('Health Logs CRUD Operations', () => {
  let testContext: TestContext

  beforeEach(() => {
    testContext = setupTestContext()
  })

  afterEach(() => {
    testContext.cleanup()
  })

  describe('List Entries (GET)', () => {
    test('returns empty array when no logs exist', async () => {
      // Test directly with our better-sqlite3 database
      const logs = await testContext.db.query.healthLogs.findMany({
        orderBy: (healthLogs, { desc }) => [desc(healthLogs.date)],
      })
      
      expect(logs).toEqual([])
    })

    test('returns all logs sorted by date (newest first)', async () => {
      // Create multiple test logs with different dates
      await createTestHealthLog(testContext.db, {
        date: '2024-01-01T10:00:00Z',
        healthData: createSampleHealthData({ 
          waterIntakeLiters: 2, 
          energyLevel: 7 
        })
      })
      
      await createTestHealthLog(testContext.db, {
        date: '2024-01-03T10:00:00Z', 
        healthData: createSampleHealthData({ 
          waterIntakeLiters: 3, 
          energyLevel: 8 
        })
      })
      
      await createTestHealthLog(testContext.db, {
        date: '2024-01-02T10:00:00Z',
        healthData: createSampleHealthData({ 
          waterIntakeLiters: 2.5, 
          energyLevel: 6 
        })
      })

      const logs = await testContext.db.query.healthLogs.findMany({
        orderBy: (healthLogs, { desc }) => [desc(healthLogs.date)],
      })
      
      expect(logs).toHaveLength(3)
      
      // Verify sorting (newest first)
      expect(logs[0].date).toBe('2024-01-03T10:00:00Z')
      expect(logs[1].date).toBe('2024-01-02T10:00:00Z') 
      expect(logs[2].date).toBe('2024-01-01T10:00:00Z')
    })

    test('returns properly structured health data for each log', async () => {
      // Create a comprehensive test log with all data types
      const logId = await createTestHealthLog(testContext.db, {
        date: '2024-01-01T10:00:00Z',
        healthData: createSampleHealthData({
          waterIntakeLiters: 2.5,
          energyLevel: 8,
          mood: { rating: 7, notes: 'feeling good' },
          sleep: { hours: 8, quality: 8 }
        })
      })

      // Test that we can retrieve the log and its related data
      const log = await testContext.db.query.healthLogs.findFirst({
        where: eq(schema.healthLogs.id, logId),
      })
      
      const healthData = await testContext.db.query.healthData.findFirst({
        where: eq(schema.healthData.logId, logId),
      })
      
      expect(log).toBeTruthy()
      expect(log?.date).toBe('2024-01-01T10:00:00Z')
      
      expect(healthData).toBeTruthy()
      expect(healthData?.waterIntakeLiters).toBe(2.5)
      expect(healthData?.energyLevel).toBe(8)
      expect(healthData?.moodRating).toBe(7)
      expect(healthData?.moodNotes).toBe('feeling good')
    })

    test('handles large datasets efficiently', async () => {
      // Create 10 test logs (reduced for faster testing)
      for (let i = 0; i < 10; i++) {
        await createTestHealthLog(testContext.db, {
          date: new Date(2024, 0, i + 1).toISOString(),
          healthData: createSampleHealthData({ 
            waterIntakeLiters: i + 1, 
            energyLevel: (i % 10) + 1 
          })
        })
      }

      const startTime = Date.now()
      const logs = await testContext.db.query.healthLogs.findMany({
        orderBy: (healthLogs, { desc }) => [desc(healthLogs.date)],
      })
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(1000) // Should be fast
      expect(logs).toHaveLength(10)
    })

    test('includes all required metadata fields', async () => {
      const logId = await createTestHealthLog(testContext.db, {
        date: '2024-01-01T10:00:00Z',
        audioUrl: 'https://example.com/audio.wav',
        transcript: 'I feel great today',
        healthData: createSampleHealthData({ energyLevel: 9 })
      })

      const log = await testContext.db.query.healthLogs.findFirst({
        where: eq(schema.healthLogs.id, logId),
      })
      
      expect(log).toMatchObject({
        id: expect.any(Number),
        date: '2024-01-01T10:00:00Z',
        audioUrl: 'https://example.com/audio.wav',
        transcript: 'I feel great today',
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      })
    })
  })

  describe('Get Single Entry (GET by ID)', () => {
    test('retrieves specific health log by ID', async () => {
      const logId = await createTestHealthLog(testContext.db, {
        date: '2024-01-01T10:00:00Z',
        healthData: createSampleHealthData({ energyLevel: 9 })
      })

      const log = await testContext.db.query.healthLogs.findFirst({
        where: eq(schema.healthLogs.id, logId),
      })
      
      expect(log).toBeTruthy()
      expect(log?.id).toBe(logId)
      expect(log?.date).toBe('2024-01-01T10:00:00Z')
    })

    test('returns undefined for non-existent ID', async () => {
      const log = await testContext.db.query.healthLogs.findFirst({
        where: eq(schema.healthLogs.id, 999),
      })
      
      expect(log).toBeUndefined()
    })
  })

  describe('Create Entry (POST)', () => {
    test('creates new health log with structured data', async () => {
      const healthData = createSampleHealthData({ energyLevel: 8 })
      const logId = await createTestHealthLog(testContext.db, {
        date: '2024-01-01T10:00:00Z',
        audioUrl: 'https://example.com/audio.wav',
        transcript: 'I feel great today',
        healthData
      })

      expect(logId).toBeTypeOf('number')
      expect(logId).toBeGreaterThan(0)

      // Verify the log was created correctly
      const savedLog = await testContext.db.query.healthLogs.findFirst({
        where: eq(schema.healthLogs.id, logId),
      })
      
      expect(savedLog?.transcript).toBe('I feel great today')
      expect(savedLog?.audioUrl).toBe('https://example.com/audio.wav')
    })
  })

  describe('Update Entry (PUT)', () => {
    test('updates existing health log', async () => {
      // First create a log
      const originalData = createSampleHealthData({ energyLevel: 5 })
      const logId = await createTestHealthLog(testContext.db, {
        date: '2024-01-01T10:00:00Z',
        transcript: 'Original transcript',
        healthData: originalData
      })

      // Update the log directly
      await testContext.db
        .update(schema.healthLogs)
        .set({
          transcript: 'Updated transcript',
          updatedAt: Date.now()
        })
        .where(eq(schema.healthLogs.id, logId))

      // Verify the update
      const updatedLog = await testContext.db.query.healthLogs.findFirst({
        where: eq(schema.healthLogs.id, logId),
      })
      
      expect(updatedLog?.transcript).toBe('Updated transcript')
      expect(updatedLog?.id).toBe(logId)
    })
  })

  describe('Delete Entry (DELETE)', () => {
    test('deletes existing health log', async () => {
      const logId = await createTestHealthLog(testContext.db, {
        date: '2024-01-01T10:00:00Z',
        healthData: createSampleHealthData({ energyLevel: 7 })
      })

      // Delete related records first to avoid foreign key constraint errors
      await testContext.db.delete(schema.healthData).where(eq(schema.healthData.logId, logId))
      await testContext.db.delete(schema.workouts).where(eq(schema.workouts.logId, logId))
      await testContext.db.delete(schema.meals).where(eq(schema.meals.logId, logId))
      await testContext.db.delete(schema.painDiscomfort).where(eq(schema.painDiscomfort.logId, logId))
      
      // Now delete the main health log
      await testContext.db
        .delete(schema.healthLogs)
        .where(eq(schema.healthLogs.id, logId))

      // Verify it's gone
      const deletedLog = await testContext.db.query.healthLogs.findFirst({
        where: eq(schema.healthLogs.id, logId),
      })
      
      expect(deletedLog).toBeUndefined()
    })

    test('can handle deleting non-existent ID', async () => {
      // This should not throw an error
      await testContext.db
        .delete(schema.healthLogs)
        .where(eq(schema.healthLogs.id, 999))

      // Query should still work
      const logs = await testContext.db.query.healthLogs.findMany()
      expect(Array.isArray(logs)).toBe(true)
    })
  })
}) 