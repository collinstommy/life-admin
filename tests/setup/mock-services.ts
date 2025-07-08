import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock responses for different scenarios
export const mockHealthDataResponse = {
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

// MSW server setup
export const server = setupServer(
  // Mock Gemini health extraction API
  http.post('*/api/ai/*', ({ request }) => {
    return HttpResponse.json(mockHealthDataResponse)
  }),
  
  // Mock any external AI service calls
  http.post('*/v1/models/*', ({ request }) => {
    return HttpResponse.json(mockHealthDataResponse)
  })
)

// Utility functions to customize mock responses
export function setMockHealthData(data: Partial<typeof mockHealthDataResponse>) {
  Object.assign(mockHealthDataResponse, data)
}

export function resetMockHealthData() {
  Object.assign(mockHealthDataResponse, {
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
  })
} 