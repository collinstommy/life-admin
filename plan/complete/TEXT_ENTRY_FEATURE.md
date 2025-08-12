# Text-Based Health Log Entry Feature

## 1. Overview

This feature will allow users to create a new health log entry by typing text directly into the application, as an alternative to the existing voice recording functionality. The user-provided text will be processed by the AI to extract structured health data, which will then be saved to the database. This provides more flexibility for users who prefer typing or are in an environment where voice recording is not feasible.

## 2. Frontend Implementation

### a. New Component: `ManualEntryScreen.tsx`

A new screen component will be created at `src/client/components/ManualEntryScreen.tsx`. This component will contain:
- A title, e.g., "New Text Entry".
- A `<textarea>` for the user to input their health log.
- A "Submit" button to process the text.
- Loading and error states to provide feedback to the user during processing.

### b. Routing

The main router (`src/client/router.tsx`) will be updated to include a new route for the `ManualEntryScreen`. A button or link will be added to the `HomeScreen.tsx` to navigate to this new screen.

### c. `useHealthLogs.ts` Hook

The `useHealthLogs.ts` hook will be updated with a new mutation for creating a health log from text.

```typescript
// In src/client/hooks/useHealthLogs.ts

export const useCreateHealthLogFromText = () => {
  // ... mutation logic using React Query
  // This will call the new backend endpoint.
};
```

## 3. Backend Implementation

### a. New API Endpoint: `/api/create-health-log-from-text`

A new POST endpoint will be created in `src/server.tsx`. This endpoint will:
- Accept a JSON payload with a `text` field.
- Use Zod for validation to ensure the `text` field is a non-empty string.
- Reuse the existing `extractStructuredData` function from `src/lib/ai.ts` to process the text.
- Reuse the existing database insertion logic from `src/lib/db.ts` to save the new log.
- The `health_logs` table entry will have a `null` value for `audioUrl`. The provided text will be stored in the `transcript` column.
- Return the newly created health log data to the client.

## 4. Data Flow

1.  User navigates to the "New Text Entry" screen.
2.  User types their health log into the text area and clicks "Submit".
3.  The frontend calls the `/api/create-health-log-from-text` endpoint with the text content.
4.  The backend receives the text, uses the AI to extract structured data.
5.  The backend saves the transcript (the user's text) and the structured data into the D1 database.
6.  The backend returns the saved data.
7.  The frontend displays a success message and navigates the user to the "View Entries" screen or the newly created entry's detail view.

## 5. Implementation Steps

-   [ ] **Backend:** Create the `/api/create-health-log-from-text` endpoint in `src/server.tsx`.
-   [ ] **Backend:** Add validation for the new endpoint's payload.
-   [ ] **Backend:** Implement the logic to call the AI service and save the data to the database.
-   [ ] **Frontend:** Create the `ManualEntryScreen.tsx` component.
-   [ ] **Frontend:** Add the new route to `src/client/router.tsx`.
-   [ ] **Frontend:** Add a button to `HomeScreen.tsx` to navigate to the new screen.
-   [ ] **Frontend:** Implement the `useCreateHealthLogFromText` mutation in `useHealthLogs.ts`.
-   [ ] **Frontend:** Connect the `ManualEntryScreen` to the new mutation, including loading and error handling.
-   [ ] **Testing:** Manually test the end-to-end flow.
