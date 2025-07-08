# Simplified E2E Testing Plan for Health Tracking App

## Context
Solo dev side project built on Cloudflare Workers with Hono. **Simplified approach**: Focus on E2E tests with in-memory SQLite for maximum value with minimal complexity.

## Testing Strategy

### **Single Focus: E2E Tests with In-Memory DB** 🎯
Test complete user journeys using real code paths but with:
- **In-memory SQLite** (instead of D1) for fast, isolated tests
- **Mocked AI services** (Gemini) for predictable responses
- **Real HTTP requests** through your Hono app

### **Core Test Scenarios** (All E2E)
1. **🔥 CRITICAL: Complete Recording Flow**
   - Upload audio → Extract health data → Store → Retrieve

2. **🔥 CRITICAL: Health Logs API**
   - Create, read, update, delete health logs
   - Filtering and pagination

3. **🔥 CRITICAL: Frontend Integration**
   - Component rendering with real API data
   - User interactions (clicks, form submissions)

4. **⚡ HIGH: Authentication Flow**
   - Login → JWT validation → Protected endpoints

5. **⚡ HIGH: Error Handling**
   - Invalid audio, AI service failures, malformed data

### **Testing Framework: Keep It Simple**

#### **Recommended Stack:**
- **Vitest**: Fast, great TypeScript support
- **Better-sqlite3**: In-memory SQLite database
- **MSW**: Mock AI services (Gemini)
- **Supertest-like**: HTTP testing against Hono app

#### **No Complex Setup:**
- No separate unit/integration layers
- No complex Workers environment simulation
- No extensive mocking infrastructure

### **Test Structure**
```
tests/
├── e2e/
│   ├── recording-flow.test.ts      # Complete audio → data flow
│   ├── health-logs-api.test.ts     # CRUD operations
│   ├── frontend-integration.test.ts # Frontend components with real data
│   ├── auth.test.ts                # Authentication flows
│   └── error-handling.test.ts      # Edge cases and failures
├── setup/
│   ├── test-db.ts                  # In-memory SQLite setup
│   ├── mock-services.ts            # AI service mocks
│   ├── test-app.ts                 # Test app instance
│   └── test-helpers.ts             # Common utilities
└── fixtures/
    ├── sample-audio.wav             # Test audio files
    └── sample-responses.json        # Mock AI responses
```

## Frontend Testing Strategy (Skip Puppeteer!)

### **Why NOT Puppeteer/Playwright for Solo Dev?**
- **Complex setup** - Browser automation adds significant overhead
- **Flaky tests** - Browser tests are notorious for random failures
- **Slow execution** - Can take 30+ seconds vs 2-3 seconds for component tests
- **Maintenance burden** - Browser API changes, timing issues, screenshot management

### **Better Approach: Lightweight Component Testing**

**Use React Testing Library + Your Existing E2E Setup:**

```typescript
// tests/e2e/frontend-integration.test.ts
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ViewEntriesScreen } from '../../src/client/components/ViewEntriesScreen'

describe('Frontend Integration', () => {
  let queryClient: QueryClient
  let mockAPI: any

  beforeEach(() => {
    // Set up fresh query client
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    
    // Mock the API client to use our test server
    mockAPI = createMockAPIClient(testApp)
  })

  test('ViewEntriesScreen renders health logs from real API', async () => {
    // Create test data in our in-memory DB
    await createTestHealthLog(db, {
      date: '2024-01-01T10:00:00Z',
      healthData: { 
        waterIntakeLiters: 2.5,
        workouts: [{ type: 'running', durationMinutes: 30 }]
      }
    })

    // Render component with real API integration
    render(
      <QueryClientProvider client={queryClient}>
        <ViewEntriesScreen />
      </QueryClientProvider>
    )

    // Verify data loads and displays correctly
    await waitFor(() => {
      expect(screen.getByText('January 1, 2024')).toBeInTheDocument()
      expect(screen.getByText('🏋️ 1 workout')).toBeInTheDocument()
      expect(screen.getByText('Water: 2.5L')).toBeInTheDocument()
    })
  })

  test('delete button removes entry via real API', async () => {
    const logId = await createTestHealthLog(db, {
      date: '2024-01-01T10:00:00Z',
      healthData: { energyLevel: 8 }
    })

    render(
      <QueryClientProvider client={queryClient}>
        <ViewEntriesScreen />
      </QueryClientProvider>
    )

    // Wait for entry to load
    await waitFor(() => {
      expect(screen.getByText('January 1, 2024')).toBeInTheDocument()
    })

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await userEvent.click(deleteButton)

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    await userEvent.click(confirmButton)

    // Verify entry is removed from DB and UI
    await waitFor(() => {
      expect(screen.queryByText('January 1, 2024')).not.toBeInTheDocument()
    })

    // Verify it's actually deleted in database
    const logs = await getAllHealthLogs(testAppContext)
    expect(logs).toHaveLength(0)
  })
})
```

### **What This Approach Tests:**
✅ **Component rendering** with real API data  
✅ **User interactions** (clicks, form submissions)  
✅ **API integration** (uses your real endpoints)  
✅ **Data flow** (database → API → component → UI)  
✅ **Error states** (loading, errors, empty states)

### **What It Doesn't Test (and that's OK):**
❌ **Cross-browser compatibility** (not critical for side project)  
❌ **Complex user journeys** (your E2E API tests cover business logic)  
❌ **Visual regression** (manual testing is sufficient)  
❌ **Mobile responsiveness** (manual testing + CSS testing tools)

## List Entries Feature Testing

The **list entries** feature (`GET /api/health-log`) would be thoroughly tested in `health-logs-api.test.ts`:

### **E2E Test Scenarios for List Entries**

```typescript
// tests/e2e/health-logs-api.test.ts
describe('Health Logs List Entries', () => {
  
  test('returns empty array when no logs exist', async () => {
    const response = await testApp.request('/api/health-log')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toEqual({
      logs: [],
      message: expect.stringContaining('No health logs found')
    })
  })

  test('returns all logs sorted by date (newest first)', async () => {
    // Create multiple test logs with different dates
    await createTestHealthLog(db, {
      date: '2024-01-01T10:00:00Z',
      healthData: { waterIntakeLiters: 2, energyLevel: 7 }
    })
    await createTestHealthLog(db, {
      date: '2024-01-03T10:00:00Z', 
      healthData: { waterIntakeLiters: 3, energyLevel: 8 }
    })
    await createTestHealthLog(db, {
      date: '2024-01-02T10:00:00Z',
      healthData: { waterIntakeLiters: 2.5, energyLevel: 6 }
    })

    const response = await testApp.request('/api/health-log')
    const logs = await response.json()
    
    expect(response.status).toBe(200)
    expect(logs).toHaveLength(3)
    
    // Verify sorting (newest first)
    expect(logs[0].date).toBe('2024-01-03T10:00:00Z')
    expect(logs[1].date).toBe('2024-01-02T10:00:00Z') 
    expect(logs[2].date).toBe('2024-01-01T10:00:00Z')
  })

  test('returns properly structured health data for each log', async () => {
    // Create a comprehensive test log with all data types
    await createTestHealthLog(db, {
      date: '2024-01-01T10:00:00Z',
      healthData: {
        waterIntakeLiters: 2.5,
        energyLevel: 8,
        mood: { rating: 7, notes: 'feeling good' },
        sleep: { hours: 8, quality: 'excellent' },
        workouts: [
          { type: 'running', durationMinutes: 30, intensity: 'moderate' }
        ],
        meals: [
          { type: 'breakfast', notes: 'oatmeal with berries' }
        ],
        painDiscomfort: {
          location: 'back', 
          intensity: 2, 
          notes: 'slight soreness'
        }
      }
    })

    const response = await testApp.request('/api/health-log')
    const logs = await response.json()
    
    expect(logs[0].healthData).toMatchObject({
      waterIntakeLiters: 2.5,
      energyLevel: 8,
      mood: { rating: 7, notes: 'feeling good' },
      sleep: { hours: 8, quality: 'excellent' },
      workouts: [
        expect.objectContaining({
          type: 'running',
          durationMinutes: 30,
          intensity: 'moderate'
        })
      ],
      meals: [
        expect.objectContaining({
          type: 'breakfast',
          notes: 'oatmeal with berries'
        })
      ],
      painDiscomfort: expect.objectContaining({
        location: 'back',
        intensity: 2
      })
    })
  })

  test('handles large datasets efficiently', async () => {
    // Create 50 test logs
    for (let i = 0; i < 50; i++) {
      await createTestHealthLog(db, {
        date: new Date(2024, 0, i + 1).toISOString(),
        healthData: { waterIntakeLiters: i + 1, energyLevel: (i % 10) + 1 }
      })
    }

    const startTime = Date.now()
    const response = await testApp.request('/api/health-log')
    const endTime = Date.now()
    
    expect(response.status).toBe(200)
    expect(endTime - startTime).toBeLessThan(1000) // Should be fast
    
    const logs = await response.json()
    expect(logs).toHaveLength(50)
  })

  test('includes all required metadata fields', async () => {
    await createTestHealthLog(db, {
      date: '2024-01-01T10:00:00Z',
      audioUrl: 'https://example.com/audio.wav',
      transcript: 'I feel great today',
      healthData: { energyLevel: 9 }
    })

    const response = await testApp.request('/api/health-log')
    const logs = await response.json()
    
    expect(logs[0]).toMatchObject({
      id: expect.any(Number),
      date: '2024-01-01T10:00:00Z',
      audioUrl: 'https://example.com/audio.wav',
      transcript: 'I feel great today',
      healthData: expect.any(Object),
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number)
    })
  })

  test('handles database errors gracefully', async () => {
    // Simulate database error by closing connection
    db.close()
    
    const response = await testApp.request('/api/health-log')
    
    expect(response.status).toBe(500)
    const error = await response.json()
    expect(error).toHaveProperty('error')
    expect(error.error).toBe('Failed to fetch health logs')
  })
})

### **Supporting Test Utilities**

```typescript
// tests/setup/test-helpers.ts
export async function createTestHealthLog(db: Database, data: {
  date: string
  audioUrl?: string
  transcript?: string  
  healthData: StructuredHealthData
}) {
  // Insert main health log
  const logResult = await db.insert(schema.healthLogs).values({
    date: data.date,
    audioUrl: data.audioUrl || null,
    transcript: data.transcript || null,
    structuredData: JSON.stringify(data.healthData),
    createdAt: Date.now(),
    updatedAt: Date.now()
  }).returning({ id: schema.healthLogs.id })
  
  const logId = logResult[0].id
  
  // Insert related data (health data, workouts, meals, etc.)
  // ... detailed implementation
  
  return logId
}
```

## Implementation Todos

### Phase 1: Setup (1-2 days)
- [x] **COMPLETE** - Install Vitest + better-sqlite3 + MSW
- [x] **COMPLETE** - Create in-memory SQLite test database setup
- [x] **COMPLETE** - Set up AI service mocks (Gemini responses)
- [x] **COMPLETE** - Create test helpers and sample fixtures

### Phase 2: Core E2E Tests (2-3 days)
- [ ] **TODO** - E2E test: Complete recording flow (upload → process → store → retrieve)
- [ ] **IN_PROGRESS** - E2E test: Health logs CRUD operations
- [ ] **TODO** - Frontend integration test: Component rendering with real API data
- [ ] **TODO** - Frontend integration test: User interactions (delete, edit)
- [ ] **TODO** - E2E test: Authentication flow with JWT

### Phase 3: Edge Cases & Polish (1 day)
- [ ] **TODO** - E2E test: Error handling scenarios
- [ ] **TODO** - Add test coverage reporting
- [ ] **TODO** - Set up simple CI/CD with GitHub Actions

**Total: 4-6 days** (much faster than original plan!)

## E2E Testing Patterns

### **In-Memory Database Setup**
```typescript
// tests/setup/test-db.ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

export function createTestDB() {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite)
  
  // Run migrations
  migrate(db, { migrationsFolder: './drizzle' })
  
  return { db, sqlite }
}
```

### **AI Service Mocking**
```typescript
// tests/setup/mock-services.ts
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const server = setupServer(
  // Mock Gemini health extraction
  http.post('*/gemini', () => {
    return HttpResponse.json({
      water_intake: 8,
      sleep: { duration: 8, quality: "good" }
    })
  })
)
```

### **E2E Test Pattern**
```typescript
// tests/e2e/recording-flow.test.ts
import { describe, test, expect, beforeEach } from 'vitest'
import { createTestDB } from '../setup/test-db'
import { testApp } from '../setup/test-helpers'

describe('Complete Recording Flow', () => {
  let db: ReturnType<typeof createTestDB>
  
  beforeEach(() => {
    db = createTestDB()
  })
  
  test('uploads audio → processes → stores → retrieves', async () => {
    // Upload audio file
    const uploadResponse = await testApp.request('/api/recordings', {
      method: 'POST',
      body: new FormData().append('audio', sampleAudio)
    })
    
    expect(uploadResponse.status).toBe(200)
    
    // Verify health log was created
    const logsResponse = await testApp.request('/api/health-logs')
    const logs = await logsResponse.json()
    
    expect(logs).toHaveLength(1)
    expect(logs[0].structured_data.water_intake).toBe(8)
  })
})
```

### **Success Criteria (Simplified)**
- **All critical user journeys working** (4 main E2E tests)
- **Fast test execution** (<10 seconds total)
- **Easy to run locally** (single `npm test` command)
- **No flaky tests** (deterministic with mocked services)

## Dependencies & Setup

### **Package Additions**
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "better-sqlite3": "^9.0.0",
    "@types/better-sqlite3": "^7.6.0",
    "msw": "^2.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^23.0.0"
  }
}
```

### **Configuration Files**
- `vitest.config.ts` - Test runner configuration
- `tests/setup/` - Test database and mocks
- `.github/workflows/test.yml` - Simple CI pipeline

## Why This Approach Works for Solo Devs

### **Benefits of E2E + In-Memory SQLite**
- **Maximum coverage with minimum effort** - tests the entire stack
- **Fast execution** - in-memory DB is lightning fast
- **Real confidence** - tests actual user workflows, not isolated units
- **Simple maintenance** - no complex mocking hierarchy
- **Easy debugging** - full stack traces when things break

### **What We're NOT Testing (and that's OK)**
- Individual utility functions (covered by E2E usage)
- Database connection logic (using real SQLite, just in-memory)
- Complex mocking scenarios (using simple, predictable mocks)

### **Perfect for Side Projects**
- **Low maintenance overhead** - tests break when features break, not when refactoring
- **High confidence** - covers the flows users actually care about
- **Quick feedback** - fast enough to run on every commit

## Next Steps
Ready to implement? The plan is designed to give you working tests quickly:

1. **Start with Phase 1 setup** (2 hours max)
2. **Write one complete E2E test** (1-2 hours) 
3. **Add remaining critical flows** (2-4 hours)
4. **Polish and CI setup** (1 hour)

**Total: Half a day to full testing confidence! 🚀** 