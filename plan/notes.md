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

The application's core purpose is to provide a low-friction way for users to log daily health activities via voice recordings. These recordings are then automatically transcribed and processed by AI to extract structured health data (e.g., meals, exercise, sleep, mood, weight). This structured data is stored and can be used for tracking health patterns and potentially for further AI analysis.

## Development Status (from `plan/complete/plan.md`):

*   **Phase 1 (Basic Recording & Storage):** Completed. This includes setting up the project, basic HTML/CSS UI, and client-side audio recording with mock upload functionality.
*   **Phase 2 (Backend Integration):** In progress. This involves setting up the Hono server, R2 storage, Cloudflare Whisper for transcription, and Gemini for structured data extraction, and returning this data to the frontend.
*   **Phase 3 (UI Refinement and Testing):** Planned. This includes database integration (saving structured data to D1), UI improvements, error handling, and full workflow testing.
*   **Phase 4 (Review and Editing):** Planned.
*   **Phase 5 (Deployment and Optimization):** Planned.