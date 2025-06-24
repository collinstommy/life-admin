# Health Tracking Voice Recording Application Plan

This document outlines the implementation plan for a health tracking application that records voice data, processes it into structured data, and stores it for later retrieval.

## Database Schema (DrizzleJS for Cloudflare D1)

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Main table to store health logs
export const healthLogs = sqliteTable('health_logs', {
  id: text('id').primaryKey(), // UUID
  date: text('date').notNull(), // YYYY-MM-DD format
  audioUrl: text('audio_url').notNull(), // R2 URL to audio file
  transcript: text('transcript'), // Raw transcript from Whisper
  createdAt: integer('created_at').notNull(), // Unix timestamp
  updatedAt: integer('updated_at').notNull(), // Unix timestamp
});

// Table for structured health data
export const healthData = sqliteTable('health_data', {
  id: text('id').primaryKey(), // UUID
  logId: text('log_id').notNull().references(() => healthLogs.id), // Foreign key to health_logs
  screenTimeHours: real('screen_time_hours'),
  waterIntakeLiters: real('water_intake_liters'),
  sleepHours: real('sleep_hours'),
  sleepQuality: integer('sleep_quality'), // 1-10 rating
  energyLevel: integer('energy_level'), // 1-10 rating
  moodRating: integer('mood_rating'), // 1-10 rating
  moodNotes: text('mood_notes'),
  weightKg: real('weight_kg'),
  otherActivities: text('other_activities'),
  generalNotes: text('general_notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Table for workout data (multiple per health log)
export const workouts = sqliteTable('workouts', {
  id: text('id').primaryKey(), // UUID
  logId: text('log_id').notNull().references(() => healthLogs.id),
  type: text('type').notNull(),
  durationMinutes: integer('duration_minutes'),
  distanceKm: integer('distance_km'),
  intensity: integer('intensity'), // 1-10 rating
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Table for meals (multiple per health log)
export const meals = sqliteTable('meals', {
  id: text('id').primaryKey(), // UUID
  logId: text('log_id').notNull().references(() => healthLogs.id),
  type: text('type').notNull(), // Breakfast, Lunch, Dinner, Snacks, Coffee
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Table for pain/discomfort entries
export const painDiscomfort = sqliteTable('pain_discomfort', {
  id: text('id').primaryKey(), // UUID
  logId: text('log_id').notNull().references(() => healthLogs.id),
  location: text('location'),
  intensity: integer('intensity'), // 1-10 rating
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
```

## Implementation Plan

### Frontend and Backend Integration with Hono

The application will be built using Cloudflare Workers with Hono as the web framework:
- HTML, CSS, and JavaScript files will be served as static assets directly from the worker
- Hono will handle both API routes and static file serving
- Frontend assets will be bundled and included in the worker deployment

Key components:
1. Audio recording module (client-side JavaScript)
2. UI controls and display (HTML/CSS)
3. Hono server for routing and API implementation
4. Static file serving middleware for Hono

### Application Flow
1. User visits the application URL, served by Hono from the worker
2. Frontend assets (HTML, CSS, JS) are served by Hono's static file middleware
3. User records voice on the web page using the JavaScript recording functionality
4. Audio is sent to the Hono API endpoint (POST endpoint)
5. Backend stores the audio in R2
6. Backend extracts transcript using Whisper
7. Transcript is sent to Gemini to get structured data (JSON)
8. Structured data is stored in D1 database
9. Backend responds with the structured data (JSON)

## Voice-to-JSON Prompt

This prompt will be used to extract structured data from the transcript:

```
Convert the following health log transcript into a structured JSON format:

[TRANSCRIPT]

Format it exactly according to this schema:
{
  "date": "YYYY-MM-DD",
  "screenTimeHours": number or null,
  "workouts": [
    {
      "type": "string",
      "durationMinutes": number,
      "distanceKm": number,
      "intensity": number (1-10),
      "notes": "string"
    }
  ],
  "meals": [
    {
      "type": "Breakfast|Lunch|Dinner|Snacks|Coffee",
      "notes": "string"
    }
  ],
  "waterIntakeLiters": number or null,
  "painDiscomfort": {
    "location": "string" or null,
    "intensity": number (1-10) or null,
    "notes": "string" or null
  },
  "sleep": {
    "hours": number or null,
    "weightKg": number or null,
    "otherActivities": "string" or null,
    "generalNotes": "string" or null
  }
}

Make sure all fields match the exact format. Use null for missing values. If the date is mentioned in the transcript, use that date. Otherwise, use the current date.

Only extract information that is explicitly mentioned in the transcript. Do not infer or make up information.
```

## JSON Response Example

Here's an example of what the response JSON would look like after processing a health log:

```json
{
  "date": "2023-06-15",
  "screenTimeHours": 3.5,
  "workouts": [
    {
      "type": "Yoga",
      "durationMinutes": 45,
      "intensity": 7,
      "notes": "Focused on deep stretching and back strengthening"
    },
    {
      "type": "Walking",
      "durationMinutes": 30,
      "distanceKm": 5,
      "intensity": 4,
      "notes": "Quick walk around the neighborhood"
    }
  ],
  "meals": [
    {
      "type": "Breakfast",
      "notes": "Overnight oats with berries and a tablespoon of chia seeds"
    },
    {
      "type": "Lunch",
      "notes": "Quinoa salad with chickpeas and avocado"
    },
    {
      "type": "Dinner",
      "notes": "Stir-fried vegetables with tofu and brown rice"
    },
    {
      "type": "Snacks",
      "notes": "Apple and a handful of mixed nuts"
    },
    {
      "type": "Coffee",
      "notes": "2 cups"
    }
  ],
  "waterIntakeLiters": 2.5,
  "painDiscomfort": {
    "location": "Lower back",
    "intensity": 3,
    "notes": "Mild discomfort after sitting for long periods"
  },
  "sleep": {
    "hours": 7.5,
    "quality": 8
  },
  "energyLevel": 7,
  "mood": {
    "rating": 8,
    "notes": "Feeling productive and generally positive"
  },
  "weightKg": 68.2,
  "otherActivities": "30 minutes of meditation and 1 hour of reading",
  "generalNotes": "Overall a balanced day. Need to focus on better posture while working."
}
```

## Project Structure

```
/
├── src/
│   ├── db/
│   │   └── schema.ts          # Database schema definition
│   ├── api/
│   │   ├── health-log.ts      # Endpoint for handling health logs
│   │   └── index.ts           # API router
│   ├── lib/
│   │   ├── audio.ts           # Audio processing utilities
│   │   ├── ai.ts              # AI integration (Whisper, Gemini)
│   │   └── storage.ts         # R2 storage utilities
│   ├── static/
│   │   ├── index.html         # Main application page
│   │   ├── styles.css         # Application styles
│   │   └── js/
│   │       ├── app.js         # Main application logic
│   │       └── recorder.js    # Audio recording functionality
│   ├── middleware/
│   │   └── static.ts          # Static file serving middleware configuration
│   └── index.ts               # Main worker entry point with Hono setup
├── wrangler.toml              # Cloudflare Workers configuration
└── package.json               # Project dependencies
```

## Development Phases

### Phase 1: Setup webpage to record voice ✅
- ✅ Set up the project structure and dependencies
- ✅ Create a basic HTML/CSS interface
- ✅ Implement audio recording in plain JavaScript

**Implemented for Phase 1:**
- Created a responsive HTML/CSS user interface with sections for recording, preview, and results
- Implemented a `VoiceRecorder` class to handle audio recording functionality using the MediaRecorder API
- Added UI controls for starting, stopping, and previewing recordings
- Added a timer display to show recording duration
- Implemented mock functionality for "uploading" recordings (to be replaced in Phase 2)
- Added display of sample JSON results to demonstrate the expected output format

### Phase 2: Backend Integration
- Set up Hono server in Cloudflare Workers
- Configure static file serving middleware to serve the frontend assets
- Implement R2 storage
- Integrate Cloudflare Whisper for transcription
- Integrate Gemini for structured data extraction
- Return structured data to the frontend

### Phase 3: UI Refinement and Testing

- Implement the database schema
- Implement D1 database operations
- Save structured data to D1 database
- Improve the user interface
- Implement error handling and validation
- Test the complete workflow\


### Phase 4: Add functionality for reviewing and editing data


### Phase 5: Deployment and Optimization
- Deploy to Cloudflare Workers
