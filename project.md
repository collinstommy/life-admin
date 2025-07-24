### Tech Stack Overview
1. **Frontend**:
   - React 19 with Vite
   - TanStack Router for routing
   - TanStack Query (React Query) for data fetching
   - Tailwind CSS with DaisyUI for styling
   - Iconify for icons

2. **Backend**:
   - Hono.js server framework
   - Cloudflare Workers runtime
   - Drizzle ORM for database interactions
   - Zod for schema validation

3. **Database**:
   - SQLite (local development)
   - Cloudflare D1 (production)
   - R2 for audio storage

4. **AI Integration**:
   - Cloudflare AI for transcription and health data extraction
   - Notion API integration

5. **Build Tools**:
   - Vite for frontend bundling
   - Wrangler for Cloudflare deployments
   - TypeScript across the codebase

### Key Features
1. **Voice-Based Health Tracking**:
   - Record voice logs about health metrics
   - Automatic transcription using AI
   - Structured data extraction (sleep, exercise, nutrition, mood, etc.)

2. **Manual Entry System**:
   - Text-based health log creation
   - Edit existing entries

3. **Data Visualization**:
   - View historical health data
   - Filter and analyze trends

4. **Authentication**:
   - JWT-based auth system
   - Protected API routes

5. **Database Management**:
   - SQL schema for health metrics
   - Migrations system
   - Seed data capability

### Project Structure
```
src/
├── app.tsx            # Main Hono app setup
├── server.tsx         # Server entry point
├── client/            # Frontend code
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks
│   ├── router.tsx     # Client-side routing
├── db/                # Database schema
├── lib/               # Shared utilities
│   ├── ai.ts          # AI integration
│   ├── db.ts          # Database operations
│   ├── storage.ts     # Cloud storage
├── api/               # API clients
├── types.ts           # Type definitions
```

### Development Workflow
1. **Running the App**:
   ```bash
   npm start  # Starts dev server with hot reload
   ```

2. **Database Operations**:
   ```bash
   npm run db:generate  # Generate migrations
   npm run db:apply     # Apply migrations locally
   npm run db:studio    # Open DB management UI
   ```

3. **Testing & Linting**:
   - ESLint configured with TypeScript support
   - Run linting: `npm run lint`
   - Prettier for code formatting

4. **Production Deployment**:
   ```bash
   npm run build       # Build production assets
   npm run deploy      # Deploy to Cloudflare
   ```

### Key Components
1. **VoiceRecorder** - Handles audio recording and processing
2. **ViewEntriesScreen** - Displays historical health logs
3. **EditEntryModal** - For modifying health entries
4. **TranscriptProcessor** - AI-powered transcript analysis
5. **HealthTrackerApp** - Main application container

### Notable Dependencies
- @hono/zod-validator - Request validation
- @tanstack/react-query - Data fetching
- drizzle-orm - Database ORM
- date-fns - Date handling
- zod - Schema validation

This is a modern full-stack application leveraging Cloudflare's edge platform with AI capabilities for health tracking. The architecture is well-organized with clear separation between frontend and backend concerns.