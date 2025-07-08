import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import puppeteer, { Browser, Page } from 'puppeteer'
import { setupTestContext, createTestHealthLog, createSampleHealthData } from '../setup/test-helpers'
import type { TestContext } from '../setup/test-helpers'
import { spawn, ChildProcess } from 'child_process'

describe('Health Tracking App - Full E2E Tests', () => {
  let browser: Browser
  let page: Page
  let testContext: TestContext
  let devServer: ChildProcess
  const TEST_PORT = 8788 // Use different port for testing
  const TEST_URL = `http://localhost:${TEST_PORT}`

  beforeAll(async () => {
    // Start the dev server for testing
    console.log('🚀 Starting dev server for E2E tests...')
    devServer = spawn('npm', ['run', 'dev', '--', '--port', TEST_PORT.toString()], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    })

    // Wait for server to start (simple approach)
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true, // Set to false to see browser during development
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    console.log('✅ Dev server and browser ready')
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    if (devServer) {
      devServer.kill()
    }
    console.log('🧹 Cleaned up dev server and browser')
  })

  beforeEach(async () => {
    testContext = setupTestContext()
    page = await browser.newPage()
    
    // Set up page with console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser error:', msg.text())
      }
    })
    
    page.on('pageerror', error => {
      console.log('Page error:', error.message)
    })
  })

  afterEach(async () => {
    if (page) {
      await page.close()
    }
    testContext.cleanup()
  })

  describe('View Entries Screen', () => {
    test('shows empty state when no entries exist', async () => {
      await page.goto(`${TEST_URL}/view-entries`)
      
      // Wait for page to load
      await page.waitForSelector('h1', { timeout: 10000 })
      
      // Check for empty state content
      const emptyStateTitle = await page.$eval('h3', el => el.textContent)
      expect(emptyStateTitle).toContain('No Entries Yet')
      
      const entryCount = await page.$eval('p', el => el.textContent)
      expect(entryCount).toContain('0 entries')
      
      // Check for "Add Your First Entry" button
      const addButton = await page.$('a[href="/add-entry"]')
      expect(addButton).toBeTruthy()
    })

    test('displays health entries with proper data', async () => {
      // Create test data in the database
      await createTestHealthLog(testContext.db, {
        date: '2024-01-15T10:00:00Z',
        healthData: createSampleHealthData({
          waterIntakeLiters: 2.5,
          energyLevel: 8,
          mood: { rating: 7, notes: 'feeling great' },
          sleep: { hours: 8, quality: 8 },
          workouts: [
            { type: 'running', durationMinutes: 30, intensity: 5, notes: 'morning run' }
          ],
          meals: [
            { type: 'Breakfast', notes: 'oatmeal with berries' }
          ]
        })
      })

      await page.goto(`${TEST_URL}/view-entries`)
      
      // Wait for entries to load
      await page.waitForSelector('.bg-white.rounded-xl', { timeout: 10000 })
      
      // Check entry count
      const entryCount = await page.$eval('p', el => el.textContent)
      expect(entryCount).toContain('1 entry')
      
      // Check date display
      const dateText = await page.$eval('h3', el => el.textContent)
      expect(dateText).toContain('Monday, January 15, 2024')
      
      // Check health data displays
      const healthSummary = await page.$$eval('.text-xs.text-gray-600 span', spans => 
        spans.map(span => span.textContent)
      )
      
      expect(healthSummary.some(text => text?.includes('1 workout'))).toBe(true)
      expect(healthSummary.some(text => text?.includes('1 meal'))).toBe(true)
      expect(healthSummary.some(text => text?.includes('8h sleep'))).toBe(true)
      expect(healthSummary.some(text => text?.includes('Energy 8/10'))).toBe(true)
      expect(healthSummary.some(text => text?.includes('Mood 7/10'))).toBe(true)
    })

    test('sorts multiple entries by date (newest first)', async () => {
      // Create multiple test entries
      await createTestHealthLog(testContext.db, {
        date: '2024-01-10T10:00:00Z',
        healthData: createSampleHealthData({ energyLevel: 5 })
      })
      
      await createTestHealthLog(testContext.db, {
        date: '2024-01-15T10:00:00Z',
        healthData: createSampleHealthData({ energyLevel: 8 })
      })
      
      await createTestHealthLog(testContext.db, {
        date: '2024-01-12T10:00:00Z',
        healthData: createSampleHealthData({ energyLevel: 6 })
      })

      await page.goto(`${TEST_URL}/view-entries`)
      
      // Wait for all entries to load
      await page.waitForFunction(() => 
        document.querySelectorAll('.bg-white.rounded-xl').length >= 3,
        { timeout: 10000 }
      )
      
      // Get all date headings in order
      const dates = await page.$$eval('h3', headings => 
        headings.map(h => h.textContent).filter(text => text?.includes('2024'))
      )
      
      // Verify sorting (newest first)
      expect(dates[0]).toContain('January 15, 2024')
      expect(dates[1]).toContain('January 12, 2024') 
      expect(dates[2]).toContain('January 10, 2024')
      
      // Check total count
      const entryCount = await page.$eval('p', el => el.textContent)
      expect(entryCount).toContain('3 entries')
    })
  })

  describe('Entry Navigation and Interactions', () => {
    test('navigates to single entry view when entry is clicked', async () => {
      // Create test entry
      const logId = await createTestHealthLog(testContext.db, {
        date: '2024-01-15T10:00:00Z',
        healthData: createSampleHealthData({ energyLevel: 8 })
      })

      await page.goto(`${TEST_URL}/view-entries`)
      
      // Wait for entry and click it
      await page.waitForSelector('.cursor-pointer', { timeout: 10000 })
      await page.click('.cursor-pointer')
      
      // Should navigate to single entry view
      await page.waitForSelector('h1', { timeout: 5000 })
      expect(page.url()).toContain(`/view-entry/${logId}`)
    })

    test('shows and dismisses delete confirmation dialog', async () => {
      // Create test entry
      await createTestHealthLog(testContext.db, {
        date: '2024-01-15T10:00:00Z',
        healthData: createSampleHealthData({ energyLevel: 8 })
      })

      await page.goto(`${TEST_URL}/view-entries`)
      
      // Wait for entry and click delete button
      await page.waitForSelector('button[title="Delete entry"]', { timeout: 10000 })
      await page.click('button[title="Delete entry"]')
      
      // Wait for confirmation dialog
      await page.waitForSelector('h3', { timeout: 5000 })
      const dialogTitle = await page.$eval('h3', el => el.textContent)
      expect(dialogTitle).toContain('Delete Health Entry')
      
      // Click cancel
      await page.click('button:has-text("Cancel")')
      
      // Dialog should disappear, entry should still be there
      await page.waitForFunction(() => 
        !document.querySelector('h3')?.textContent?.includes('Delete Health Entry'),
        { timeout: 5000 }
      )
      
      const entryStillExists = await page.$('.bg-white.rounded-xl')
      expect(entryStillExists).toBeTruthy()
    })
  })

  describe('Navigation', () => {
    test('back button navigates to home page', async () => {
      await page.goto(`${TEST_URL}/view-entries`)
      
      // Wait for back button and click it
      await page.waitForSelector('a[href="/"]', { timeout: 10000 })
      await page.click('a[href="/"]')
      
      // Should navigate to home
      await page.waitForNavigation({ timeout: 5000 })
      expect(page.url()).toBe(`${TEST_URL}/`)
    })
  })

  describe('Error Handling', () => {
    test('handles network errors gracefully', async () => {
      // Navigate to view entries page
      await page.goto(`${TEST_URL}/view-entries`)
      
      // Simulate network failure by intercepting requests
      await page.setRequestInterception(true)
      page.on('request', (req) => {
        if (req.url().includes('/api/health-log')) {
          req.abort()
        } else {
          req.continue()
        }
      })
      
      // Reload to trigger error
      await page.reload()
      
      // Should show error state
      await page.waitForSelector('.text-red-800', { timeout: 10000 })
      const errorText = await page.$eval('.text-red-800', el => el.textContent)
      expect(errorText).toContain('Error Loading Entries')
    })
  })

  describe('Responsive Design', () => {
    test('works on mobile viewport', async () => {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 })
      
      // Create test entry
      await createTestHealthLog(testContext.db, {
        date: '2024-01-15T10:00:00Z',
        healthData: createSampleHealthData({ energyLevel: 8 })
      })

      await page.goto(`${TEST_URL}/view-entries`)
      
      // Should still display entries properly
      await page.waitForSelector('.bg-white.rounded-xl', { timeout: 10000 })
      
      const entryCount = await page.$eval('p', el => el.textContent)
      expect(entryCount).toContain('1 entry')
      
      // Navigation should be accessible
      const backButton = await page.$('a[href="/"]')
      expect(backButton).toBeTruthy()
    })
  })
}) 