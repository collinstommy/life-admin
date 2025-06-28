## Project Overview

This is a JavaScript/TypeScript project primarily built for Cloudflare Workers, utilizing Hono as the web framework. It's a "Health Tracking Voice Recording Application" that processes voice data, extracts structured health information using AI, and stores it in a D1 database and R2 storage.

## Key Technologies and Dependencies:

*   **Cloudflare Workers:** The primary deployment environment, indicated by `wrangler.toml` and `@cloudflare/workers-types`.
*   **Hono:** A lightweight web framework for Cloudflare Workers, used for routing and API handling (`hono` package).
*   **TypeScript:** Used for development, as seen by `.ts` files and `tsconfig.json`.
*   **Drizzle ORM:** Used for database interactions with Cloudflare D1 (`drizzle-orm`, `drizzle-kit`). The `drizzle` directory contains schema and migrations.
*   **Cloudflare D1:** Serverless SQL database, indicated by `drizzle.config.ts` and `wrangler.toml`.
*   **Cloudflare R2:** Object storage for audio recordings, configured in `wrangler.toml`.
*   **AI Integration:** Implies use of Cloudflare AI services (Whisper for transcription, Gemini for structured data extraction), as mentioned in `plan/complete/plan.md`.
*   **Tailwind CSS:** Utility-first CSS framework for styling the frontend (`tailwindcss`, `tailwind.config.js`).
*   **Notion API:** Used for legacy log fetching (`src/api/notion.ts`, `@notionhq/client`, `notion-to-md`).
*   **Bun:** Used for client-side JavaScript bundling (`bun build` command in `package.json`).
*   **Authentication:** JWT-based authentication is implemented using `hono/jwt` and `hono/cookie`.

## Project Structure Breakdown:

*   **`/assets`**: Contains static frontend assets (HTML, CSS, JavaScript).
    *   `health-tracker.css`, `index.html`, `styles.css`: Frontend UI.
    *   `js/app.js`, `js/recorder.js`: Client-side application logic and audio recording.
*   **`/drizzle`**: Drizzle ORM related files.
    *   `0000_initial_schema.sql`, `migrations/`: Database schema and migration files.
*   **`/plan`**: Documentation and planning files.
    *   `auth-progress.md`, `brief.md`, `plan.md`, `plan2.md`, `progress.md`, `recording-ui.md`, `tune-prompt.md`, `summary.md`: Various planning and progress documents.
*   **`/src`**: Source code for the Cloudflare Worker.
    *   `app.tsx`, `server.tsx`: Main application and server entry points.
    *   `styles.css`: Main CSS file (processed by Tailwind).
    *   `types.ts`: TypeScript type definitions.
    *   `api/notion.ts`: Notion API client.
    *   `client/index.js`: Client-side JavaScript entry point.
    *   `db/schema.ts`: Drizzle database schema.
    *   `lib/ai.ts`, `lib/db.ts`, `lib/storage.ts`: Utility functions for AI, database, and storage.
    *   `shared/Layout.tsx`: Shared UI components.
*   **`wrangler.toml`**: Cloudflare Workers configuration.
*   **`package.json`**: Project metadata and dependencies.
*   **`drizzle.config.ts`**: Drizzle ORM configuration.
*   **`tailwind.config.js`**: Tailwind CSS configuration.
*   **`tsconfig.json`**: TypeScript configuration.
*   **`.dev.vars.sample`**: Sample environment variables for local development.
*   **`.eslintrc.js`, `.prettierrc`, `.gitignore`**: Development and code quality configuration.

## Project Purpose (from `plan/summary.md` and other plan files):
The "Health Tracking Voice Recording Application" is a streamlined personal health journal designed to minimize friction in logging daily health activities. It allows users to record voice logs, which are then processed using AI to extract structured health data. This structured data, along with the raw recordings, is stored for later retrieval, enabling users to review and analyze their health trends over time. The application aims to transform casual spoken reflections into organized, AI-analyzable data.

**Key Features and Breakdown:**

1.  **Voice Recording & Frontend:**
    *   **Web Interface:** Provides a responsive web application for recording voice logs.
    *   **UI Controls:** Includes controls for starting, stopping, and previewing recordings, along with a timer display.
    *   **Data Display:** Shows raw transcripts and extracted structured health data.
    *   **Daily Entries:** Displays entries for each day.

2.  **Backend API & Data Flow:**
    *   **RESTful Endpoints:** Handles recordings, transcripts, and structured data.
    *   **Audio Upload:** Users record voice, and the audio is sent to the backend API.
    *   **R2 Storage:** Raw audio recordings are stored in Cloudflare R2 object storage.
    *   **Transcription:** Audio is processed using Cloudflare Whisper for speech-to-text transcription.
    *   **Structured Data Extraction:** Transcripts are analyzed by Gemini (a large language model) to extract structured health data in a predefined JSON format.
    *   **D1 Database Storage:** Structured health data and metadata are stored in a Cloudflare D1 database.
    *   **Confirmation & View:** Users receive confirmation and a view of the structured data after processing.
    *   **API for Health Logs:** Provides an API to list and retrieve health logs, including filtering options and access to specific details.
    *   **Manual Data Management:** Allows for manual updates and removal of health log data.

3.  **Structured Health Data Categories:**
    The application extracts and stores detailed health metrics, including:
    *   Screen time
    *   Water intake
    *   Sleep duration and quality
    *   Energy and mood ratings
    *   Weight tracking
    *   Workout sessions (type, duration, intensity, notes)
    *   Meals and nutrition (type, notes)
    *   Pain and discomfort (location, intensity, notes)
    *   Other activities and general notes

4.  **AI Processing Pipeline:**
    *   **Speech-to-Text:** Utilizes Cloudflare Whisper for accurate transcription of voice recordings.
    *   **Structured Data Extraction:** Employs Gemini with a specific prompt engineering strategy to convert raw transcripts into a structured JSON format, ensuring only explicitly mentioned information is extracted.

5.  **Technical Stack:**
    *   **Frontend:** HTML, CSS, JavaScript.
    *   **Backend:** Cloudflare Workers with Hono (web framework).
    *   **Storage:** Cloudflare R2 (for audio), Cloudflare D1 (for structured data).
    *   **AI:** Cloudflare Whisper (transcription), Gemini (structured data extraction).

6.  **Development Roadmap (Planned Future Features):**
    *   **UI Enhancement & Data Visualization:** Improve user experience, add historical data viewing, and implement basic data visualization.
    *   **Analytics & Insights:** Introduce trend analysis features, AI-powered health insights, and data export capabilities.
    *   **Review and Editing:** Add functionality for reviewing and editing data.