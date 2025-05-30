# Database Setup Guide

Your building assessment application currently uses in-memory storage, which means data is lost when the server restarts. To make it persistent, you need a PostgreSQL database.

## Option 1: Free Cloud Database (Recommended)

### Neon (Free PostgreSQL)
1. Go to https://neon.tech
2. Sign up for a free account
3. Create a new project
4. Copy the connection string (looks like: postgresql://username:password@host/database)
5. Provide this connection string as the DATABASE_URL

### Supabase (Free PostgreSQL)
1. Go to https://supabase.com
2. Sign up and create a new project
3. Go to Settings > Database
4. Copy the connection string under "Connection string"
5. Provide this as the DATABASE_URL

### PlanetScale (Free MySQL - alternative)
1. Go to https://planetscale.com
2. Create account and new database
3. Get connection string from dashboard

## Option 2: Continue with In-Memory Storage

Your application is fully functional right now with in-memory storage. You can:
- Create and manage building assessments
- Fill out all assessment sections
- View detailed reports and analytics
- Test all features

The only limitation is that data will be lost when the server restarts.

## What happens after you provide DATABASE_URL:

1. I'll update the database configuration
2. Run migrations to create all necessary tables:
   - users (for authentication)
   - assessments (building assessment data)
   - assessment_sections (scoring data)
   - assessment_media (file uploads)
   - sessions (user sessions)
3. Switch from in-memory to persistent database storage
4. All your existing functionality will remain the same

Choose the option that works best for you!