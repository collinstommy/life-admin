## Dev Ex
- [x] use vite for frontend and tailwind build 
- [ ] set up hono client for types safety @https://hono.dev/docs/concepts/stacks#with-react
- [x] add icons from iconify - use tailwind plugin
- [ ] use vercel AI SDK for calling llm
- [ ] use zod for schema validation when calling llm
- [ ] e2e testing
- [ ] stage/qa environment


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
- [ ] Record screen
   - [ ] add examples to record screen
   - [ ] green/red color for recorder

## Features
- [x] Edit an entry - **COMPLETELY IMPLEMENTED WITH REAL AUDIO TRANSCRIPTION**
- [ ] chat interface - use vercel sdk
- [ ] add a system prompt to the chat interface + profile + goals
- [x] add a way to update an existing entry, with a voice recorder.

## Bugs
- [ ] long recording fails

## Future ideas
- [ ] Meals 
   - [ ] Save recipes
   - [ ] Chat with ai to store recipe favourites
   - [ ] design meal plan, plan out week
   - [ ] Notion connector for recipes
- [ ] Add project ideas
