## Dev Ex
- [x] use vite for frontend and tailwind build 
- [ ] set up hono client for types safety @https://hono.dev/docs/concepts/stacks#with-react
- [x] add icons from iconify - use tailwind plugin


## UI
- [x] Improve the home screen
   - create a home screen with large buttons in a grid
   - buttons: Add Entry (goes to record health screen), View Entries (placeholder screen for now), Debug (shows two links, 1 to the existing transcript screen, 1 to the existing history screen)
   - implemented with TanStack Router for proper type-safe routing
- [x] Create a view entries screen
    - show a list of entries that can be expanded
    - the expanded version should show the entry details in a clear manner, not json. Look at the `StructuredHealthData` in @ai.ts. We want to show this data in a nice format so the user can skip it and see how that day went. 
    - we want to have a delete button for each entry
    - implemented with beautiful UI showing key metrics, workouts, meals, sleep, mood, etc. in a user-friendly format
- [x] Add delete all button

## Features
- [x] Edit an entry - **COMPLETELY IMPLEMENTED WITH REAL AUDIO TRANSCRIPTION**
   - ✅ implemented with extract-first flow: record/type → extract data → review modal → record updates or save
   - ✅ new EditEntryModal shows condensed health data preview with beautiful UI
   - ✅ VoiceUpdateRecorder allows iterative voice updates to add/modify data
   - ✅ smart AI merging understands additive vs corrective language
   - ✅ three action options: Accept & Save, Record Update, Cancel
   - ✅ supports both voice recordings and manual text entry workflows
   - ✅ **FULLY PRODUCTION READY**: Complete real audio transcription implementation
     - ✅ **VoiceRecorder.tsx**: Real transcription for initial voice recordings (mocks removed)
     - ✅ **EditEntryModal.tsx**: Real transcription for voice updates (demo mode removed)
     - ✅ **Backend**: `/api/transcribe-audio` endpoint using Gemini API
     - ✅ **Frontend**: Proper loading states, error handling, and user feedback
     - ✅ **Flow**: Record → Transcribe → Extract → Review → Update → Save
     - ✅ **No mocks anywhere**: 100% real audio processing throughout the app

