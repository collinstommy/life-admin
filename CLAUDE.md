# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Looks in ./project.md for info on this project.

## Development Commands

### Database Management
```bash
npm run db:generate    # Generate migrations from schema changes
npm run db:apply       # Apply migrations to local D1 database  
npm run db:apply:remote # Apply migrations to production D1 database
npm run db:studio      # Opens Drizzle Studio for database management
npm run db:push        # Direct schema push (no migrations, dev only)
```

### Development and Build
```bash
npm start              # Start development server with auto-reload (runs client:watch + dev)
npm run dev            # Start Wrangler dev server with live-reload
npm run client:watch   # Watch and rebuild client-side bundle
npm run build          # Build production bundle with Vite
npm run deploy         # Build and deploy to Cloudflare Workers
```

## Architecture Overview

This is a **Health Tracking Voice Recording Application** built as a Cloudflare Workers application using modern web technologies.

### Core Tech Stack
- **Runtime**: Cloudflare Workers with Hono web framework
- **Frontend**: React 19 + Vite build system + TanStack Query for data management
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM  
- **Storage**: Cloudflare R2 for audio recordings
- **AI**: Cloudflare AI (Whisper for transcription, Gemini for data extraction)
- **Auth**: JWT-based authentication with cookies
- **Styling**: Tailwind CSS + DaisyUI components

### Application Flow
1. **Voice Recording**: User records voice through web interface (`VoiceRecorder.tsx`)
2. **Audio Storage**: Raw audio stored in Cloudflare R2 bucket
3. **Transcription**: Audio processed via Cloudflare Whisper AI
4. **Data Extraction**: Transcript analyzed by Gemini to extract structured health data
5. **Database Storage**: Structured data saved to D1 database using Drizzle ORM
6. **Retrieval**: Health logs retrieved and displayed with full CRUD operations

### Key Architecture Patterns

#### Server Architecture (`src/server.tsx`)
- Main entry point with comprehensive API routes
- JWT authentication middleware for protected routes  
- Zod validation for all API inputs
- Error handling with detailed logging

#### Client Architecture (React SPA)
- Single Page Application served from Cloudflare Workers
- Client-side routing handled by catch-all route in server
- TanStack Query for server state management
- Custom hooks for auth (`useAuth.ts`) and data fetching (`useHealthLogs.ts`)

#### Database Schema (`src/db/schema.ts`)
Relational structure with:
- `health_logs`: Main entries with transcript and structured data JSON
- `health_data`: Core metrics (sleep, mood, energy, etc.)  
- `workouts`: Exercise entries (type, duration, intensity)
- `meals`: Nutrition entries (type, notes)
- `pain_discomfort`: Pain tracking entries

#### AI Integration (`src/lib/ai.ts`)
- Speech-to-text via Cloudflare Whisper
- Structured data extraction via Gemini with prompt engineering
- Data merging capabilities for updates

### Environment Setup
- Copy `.dev.vars.sample` to `.dev.vars` and configure secrets
- Wrangler configuration in `wrangler.toml` defines all Cloudflare bindings
- Main deployment target: `admin.tcollins.dev`

### Client-Side Components
- `HealthTrackerApp.tsx`: Main app container with routing
- `VoiceRecorder.tsx`: Audio recording interface
- `TranscriptProcessor.tsx`: Text input and processing
- Screen-based components: `HomeScreen`, `ViewEntriesScreen`, `SingleEntryScreen`, etc.

## important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.