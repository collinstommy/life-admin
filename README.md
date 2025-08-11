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

## ToDo

### DX
- [x] admin screen to view past logs and recordings
- [x] elysia - get errors from client api?
- [x] use new design system
- [ ] schema to check for correct merged data
- [ ] robust test suite with different test cases

### Features
- [x] Edit entry using text
- [x] Improved form for text entry (meals fields, common items)


