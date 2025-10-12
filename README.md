## Notion AI Tool

- Hono
- Cloudflare
- Tailwind
- Daisy UI
- Drizzle

## Notion Integrations
https://www.notion.so/profile/integrations

## Development

### Database Management
```bash
npm run db:generate  # Generate migrations from schema changes
npm run db:apply     # Apply migrations to local D1 database
npm run db:studio    # Opens Drizzle Studio for database management
npm run db:push      # Direct schema push (no migrations, dev only)
```

### Development Server
```bash
npm start            # Start development server with auto-reload
```

## Production Deployment

### Deploy to Production    
```bash
# 1. Apply database migrations to production
npm run db:apply:remote

# 2. Deploy application to Cloudflare Workers
npm run deploy
```

## Preview Environments

- Each pull request automatically provisions a Cloudflare Worker and its own D1 database via `.github/workflows/preview.yml`.
- Required repository secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_WORKER_SUBDOMAIN` (the workers.dev subdomain for constructing preview URLs).
- The workflow runs `scripts/preview/deploy.sh`, which creates or reuses a `life-admin-pr-<PR>` Worker, applies migrations, deploys the latest build, and comments on the PR with the preview + D1 dashboard links.
- Closing the PR triggers `scripts/preview/teardown.sh` to remove the Worker and drop the temporary D1 database.
- You can test locally by exporting the same environment variables and running `npm ci && PR_NUMBER=123 scripts/preview/deploy.sh` (then `scripts/preview/teardown.sh`) against a sandbox account.

## ToDo

### Health

####  DX
- [x] admin screen to view past logs and recordings
- [x] elysia - get errors from client api?
- [x] use new design system
- [ ] schema to check for correct merged data
- [ ] robust test suite with different test cases
    - [ ] test edit
    - [ ] test create

#### Features
- [x] Edit entry using text
- [x] Improved form for text entry (meals fields, common items)

#### Bugs
- [ ] when an entry is created, briefly shows no entry message

#### Ideas
- Save recipes - meal plan, similar recipes
- Chat with ai to store recipe favourites, design meal plan, plan out week
- Notion connector for recipes
- Add project idea
- Add phyio routines - dropdown to select program

### AI Agents
- [ ] Voice correction - "Actually, that should be entertainment"

## Ideas
- [ ] tanstack start
- [ ] Update notes on workout item
- [ ] Rich text for agent saving and format
- [ ] Lunch money api for expense coach
- [ ] Diary
- [ ] Store physio routine by date
- [ ] Log weights, show gym log of easy logging 
- [ ] Tool to create new recipes and store in notion, should be able to call this from the chat
- [ ] Some sort of chat memory, maybe this is a tool that can write to a profile or some other store of info
- [ ] Recipe crawler, pull transcript from any video, add to notion and agent
- [ ] Crawl full YouTube channel 
- [ ] Setting to change the model so I can use up tokens
- [ ] Maybe use https://www.copilotkit.ai/
- [ ] Expose chat interface through telegram 
