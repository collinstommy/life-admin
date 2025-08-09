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
- [ ] admin screen to view past logs and recordings
- [ ] elysia - get errors from client api?
- [ ] use new design system
- [ ] schema to check for correct merged data

### Features
- [x] Edit entry using text
- [ ] Improved form for text entry (meals fields, common items)


